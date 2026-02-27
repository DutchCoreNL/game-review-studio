import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { action, ...params } = await req.json();

    // Get player state + profile
    const { data: playerState } = await supabase.from("player_state").select("money, loc").eq("user_id", user.id).single();
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
    if (!playerState) return new Response(JSON.stringify({ error: "No player state" }), { status: 400, headers: corsHeaders });

    const username = profile?.username || "Onbekend";

    switch (action) {
      // ========== LIST A GOOD ON THE MARKETPLACE ==========
      case "create_listing": {
        const { goodId, quantity, pricePerUnit } = params;
        if (!goodId || !quantity || !pricePerUnit || quantity <= 0 || pricePerUnit <= 0) {
          return json({ error: "Invalid params" }, 400);
        }

        // Check inventory
        const { data: inv } = await supabase.from("player_inventory").select("quantity").eq("user_id", user.id).eq("good_id", goodId).single();
        if (!inv || inv.quantity < quantity) {
          return json({ error: "Not enough inventory" }, 400);
        }

        // Deduct from inventory
        const newQty = inv.quantity - quantity;
        if (newQty <= 0) {
          await supabase.from("player_inventory").delete().eq("user_id", user.id).eq("good_id", goodId);
        } else {
          await supabase.from("player_inventory").update({ quantity: newQty }).eq("user_id", user.id).eq("good_id", goodId);
        }

        // Create listing
        const { data: listing, error: listErr } = await supabase.from("market_listings").insert({
          seller_id: user.id,
          seller_name: username,
          good_id: goodId,
          quantity,
          price_per_unit: pricePerUnit,
          district_id: playerState.loc,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }).select().single();

        if (listErr) return json({ error: listErr.message }, 500);
        return json({ success: true, listing });
      }

      // ========== BUY FROM MARKETPLACE ==========
      case "buy_listing": {
        const { listingId } = params;
        const { data: listing } = await supabase.from("market_listings").select("*").eq("id", listingId).eq("status", "active").single();
        if (!listing) return json({ error: "Listing not found or expired" }, 404);
        if (listing.seller_id === user.id) return json({ error: "Cannot buy your own listing" }, 400);

        const totalCost = listing.price_per_unit * listing.quantity;
        if (playerState.money < totalCost) return json({ error: "Not enough money" }, 400);

        // Deduct money from buyer
        await supabase.from("player_state").update({ money: playerState.money - totalCost }).eq("user_id", user.id);

        // Add money to seller
        const { data: sellerState } = await supabase.from("player_state").select("money").eq("user_id", listing.seller_id).single();
        if (sellerState) {
          await supabase.from("player_state").update({ money: sellerState.money + totalCost }).eq("user_id", listing.seller_id);
        }

        // Add goods to buyer inventory
        const { data: buyerInv } = await supabase.from("player_inventory").select("quantity, avg_cost").eq("user_id", user.id).eq("good_id", listing.good_id).single();
        if (buyerInv) {
          const newQty = buyerInv.quantity + listing.quantity;
          const newAvg = Math.floor(((buyerInv.avg_cost * buyerInv.quantity) + (listing.price_per_unit * listing.quantity)) / newQty);
          await supabase.from("player_inventory").update({ quantity: newQty, avg_cost: newAvg }).eq("user_id", user.id).eq("good_id", listing.good_id);
        } else {
          await supabase.from("player_inventory").insert({ user_id: user.id, good_id: listing.good_id, quantity: listing.quantity, avg_cost: listing.price_per_unit });
        }

        // Mark listing as sold
        await supabase.from("market_listings").update({ status: "sold" }).eq("id", listingId);

        // Log trade for price influence
        await supabase.from("market_player_trades").insert({
          buyer_id: user.id,
          seller_id: listing.seller_id,
          good_id: listing.good_id,
          quantity: listing.quantity,
          price_per_unit: listing.price_per_unit,
          district_id: listing.district_id,
          trade_type: "marketplace",
        });

        // Live price influence: large trades shift market prices
        await applyPriceInfluence(supabase, listing.good_id, listing.district_id, listing.quantity, listing.price_per_unit);

        // Notify seller
        await supabase.from("player_messages").insert({
          sender_id: user.id,
          receiver_id: listing.seller_id,
          subject: "Verkoop geslaagd!",
          body: `Je listing van ${listing.quantity}× ${listing.good_id} is gekocht voor €${totalCost.toLocaleString()}.`,
        });

        return json({ success: true, totalCost });
      }

      // ========== CANCEL LISTING ==========
      case "cancel_listing": {
        const { listingId: cancelId } = params;
        const { data: cancelListing } = await supabase.from("market_listings").select("*").eq("id", cancelId).eq("seller_id", user.id).eq("status", "active").single();
        if (!cancelListing) return json({ error: "Listing not found" }, 404);

        // Return goods to seller
        const { data: sellerInv } = await supabase.from("player_inventory").select("quantity").eq("user_id", user.id).eq("good_id", cancelListing.good_id).single();
        if (sellerInv) {
          await supabase.from("player_inventory").update({ quantity: sellerInv.quantity + cancelListing.quantity }).eq("user_id", user.id).eq("good_id", cancelListing.good_id);
        } else {
          await supabase.from("player_inventory").insert({ user_id: user.id, good_id: cancelListing.good_id, quantity: cancelListing.quantity, avg_cost: cancelListing.price_per_unit });
        }

        await supabase.from("market_listings").update({ status: "cancelled" }).eq("id", cancelId);
        return json({ success: true });
      }

      // ========== SEND DIRECT TRADE OFFER ==========
      case "send_trade_offer": {
        const { receiverId, receiverName, offerGoods, offerCash, requestGoods, requestCash, message } = params;
        if (!receiverId) return json({ error: "No receiver" }, 400);
        if (receiverId === user.id) return json({ error: "Cannot trade with yourself" }, 400);

        // Validate sender has the offered goods/cash
        if (offerCash > 0 && playerState.money < offerCash) return json({ error: "Not enough cash" }, 400);

        for (const [gid, qty] of Object.entries(offerGoods || {})) {
          const { data: inv } = await supabase.from("player_inventory").select("quantity").eq("user_id", user.id).eq("good_id", gid).single();
          if (!inv || inv.quantity < (qty as number)) return json({ error: `Not enough ${gid}` }, 400);
        }

        const { data: offer, error: offerErr } = await supabase.from("trade_offers").insert({
          sender_id: user.id,
          sender_name: username,
          receiver_id: receiverId,
          receiver_name: receiverName || "Onbekend",
          offer_goods: offerGoods || {},
          offer_cash: offerCash || 0,
          request_goods: requestGoods || {},
          request_cash: requestCash || 0,
          message: message || null,
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        }).select().single();

        if (offerErr) return json({ error: offerErr.message }, 500);

        // Notify receiver
        await supabase.from("player_messages").insert({
          sender_id: user.id,
          receiver_id: receiverId,
          subject: "Nieuw handelsaanbod!",
          body: `${username} heeft je een handelsaanbod gestuurd. Bekijk het in de Marktplaats tab.`,
        });

        return json({ success: true, offer });
      }

      // ========== ACCEPT TRADE OFFER ==========
      case "accept_trade_offer": {
        const { offerId } = params;
        const { data: offer } = await supabase.from("trade_offers").select("*").eq("id", offerId).eq("receiver_id", user.id).eq("status", "pending").single();
        if (!offer) return json({ error: "Offer not found" }, 404);

        // Validate both parties still have the goods/cash
        const { data: senderState } = await supabase.from("player_state").select("money").eq("user_id", offer.sender_id).single();
        if (!senderState) return json({ error: "Sender not found" }, 400);

        // Check sender has offer goods + cash
        if (offer.offer_cash > 0 && senderState.money < offer.offer_cash) return json({ error: "Sender no longer has enough cash" }, 400);
        // Check receiver has request goods + cash
        if (offer.request_cash > 0 && playerState.money < offer.request_cash) return json({ error: "You don't have enough cash" }, 400);

        // Transfer cash
        if (offer.offer_cash > 0 || offer.request_cash > 0) {
          await supabase.from("player_state").update({ money: senderState.money - offer.offer_cash + offer.request_cash }).eq("user_id", offer.sender_id);
          await supabase.from("player_state").update({ money: playerState.money - offer.request_cash + offer.offer_cash }).eq("user_id", user.id);
        }

        // Transfer offer goods (sender → receiver)
        for (const [gid, qty] of Object.entries(offer.offer_goods as Record<string, number>)) {
          if (qty <= 0) continue;
          await transferGoods(supabase, offer.sender_id, user.id, gid, qty);
        }

        // Transfer request goods (receiver → sender)
        for (const [gid, qty] of Object.entries(offer.request_goods as Record<string, number>)) {
          if (qty <= 0) continue;
          await transferGoods(supabase, user.id, offer.sender_id, gid, qty);
        }

        await supabase.from("trade_offers").update({ status: "accepted" }).eq("id", offerId);

        // Notify sender
        await supabase.from("player_messages").insert({
          sender_id: user.id,
          receiver_id: offer.sender_id,
          subject: "Handelsaanbod geaccepteerd!",
          body: `${username} heeft je handelsaanbod geaccepteerd.`,
        });

        return json({ success: true });
      }

      // ========== DECLINE TRADE OFFER ==========
      case "decline_trade_offer": {
        const { offerId: declineId } = params;
        const { data: declineOffer } = await supabase.from("trade_offers").select("*").eq("id", declineId).eq("receiver_id", user.id).eq("status", "pending").single();
        if (!declineOffer) return json({ error: "Offer not found" }, 404);

        await supabase.from("trade_offers").update({ status: "declined" }).eq("id", declineId);
        return json({ success: true });
      }

      // ========== GET LISTINGS ==========
      case "get_listings": {
        const { districtId, goodId } = params;
        let query = supabase.from("market_listings").select("*").eq("status", "active").order("price_per_unit", { ascending: true }).limit(50);
        if (districtId) query = query.eq("district_id", districtId);
        if (goodId) query = query.eq("good_id", goodId);
        const { data: listings } = await query;
        return json({ success: true, listings: listings || [] });
      }

      // ========== GET MY LISTINGS ==========
      case "get_my_listings": {
        const { data: myListings } = await supabase.from("market_listings").select("*").eq("seller_id", user.id).in("status", ["active"]).order("created_at", { ascending: false });
        return json({ success: true, listings: myListings || [] });
      }

      // ========== GET TRADE OFFERS ==========
      case "get_trade_offers": {
        const { data: incoming } = await supabase.from("trade_offers").select("*").eq("receiver_id", user.id).eq("status", "pending").order("created_at", { ascending: false });
        const { data: outgoing } = await supabase.from("trade_offers").select("*").eq("sender_id", user.id).in("status", ["pending"]).order("created_at", { ascending: false });
        return json({ success: true, incoming: incoming || [], outgoing: outgoing || [] });
      }

      // ========== GET RECENT PLAYER TRADES (for price influence display) ==========
      case "get_recent_trades": {
        const { goodId: tradeGood, districtId: tradeDist } = params;
        let q = supabase.from("market_player_trades").select("*").order("created_at", { ascending: false }).limit(20);
        if (tradeGood) q = q.eq("good_id", tradeGood);
        if (tradeDist) q = q.eq("district_id", tradeDist);
        const { data: trades } = await q;
        return json({ success: true, trades: trades || [] });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("Marketplace error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function transferGoods(supabase: any, fromId: string, toId: string, goodId: string, qty: number) {
  // Remove from sender
  const { data: fromInv } = await supabase.from("player_inventory").select("quantity, avg_cost").eq("user_id", fromId).eq("good_id", goodId).single();
  if (!fromInv || fromInv.quantity < qty) throw new Error(`Insufficient ${goodId}`);
  const newFromQty = fromInv.quantity - qty;
  if (newFromQty <= 0) {
    await supabase.from("player_inventory").delete().eq("user_id", fromId).eq("good_id", goodId);
  } else {
    await supabase.from("player_inventory").update({ quantity: newFromQty }).eq("user_id", fromId).eq("good_id", goodId);
  }

  // Add to receiver
  const { data: toInv } = await supabase.from("player_inventory").select("quantity, avg_cost").eq("user_id", toId).eq("good_id", goodId).single();
  if (toInv) {
    const newQty = toInv.quantity + qty;
    const newAvg = Math.floor(((toInv.avg_cost * toInv.quantity) + (fromInv.avg_cost * qty)) / newQty);
    await supabase.from("player_inventory").update({ quantity: newQty, avg_cost: newAvg }).eq("user_id", toId).eq("good_id", goodId);
  } else {
    await supabase.from("player_inventory").insert({ user_id: toId, good_id: goodId, quantity: qty, avg_cost: fromInv.avg_cost });
  }
}

async function applyPriceInfluence(supabase: any, goodId: string, districtId: string, quantity: number, tradePrice: number) {
  // Large trades (5+ units) shift the market price towards the trade price
  if (quantity < 5) return;
  const { data: mp } = await supabase.from("market_prices").select("current_price").eq("good_id", goodId).eq("district_id", districtId).single();
  if (!mp) return;

  const influence = Math.min(0.15, quantity * 0.02); // Max 15% shift
  const newPrice = Math.floor(mp.current_price * (1 - influence) + tradePrice * influence);
  const trend = newPrice > mp.current_price ? "up" : newPrice < mp.current_price ? "down" : "stable";

  await supabase.from("market_prices").update({
    current_price: newPrice,
    price_trend: trend,
    last_updated: new Date().toISOString(),
  }).eq("good_id", goodId).eq("district_id", districtId);
}
