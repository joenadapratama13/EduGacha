import random
import logging
from backend.database import get_profile, get_random_card_by_rarity, execute_gacha_transaction

logger = logging.getLogger("gacha")


class GachaError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def roll_gacha(user_id: str, use_ticket: bool = False) -> dict:
    """
    Executes a single gacha roll. Supports using Epic Gacha Ticket.
    """
    # 1. Fetch user profile
    profile = get_profile(user_id)
    if not profile:
        raise GachaError("User profile not found", status_code=404)

    coins = profile.get("coins", 0)
    pity_counter = profile.get("pity_counter", 0)
    epic_tickets = profile.get("epic_tickets", 0)

    # Validate payment method
    COIN_COST = 50
    if use_ticket:
        if epic_tickets < 1:
            raise GachaError("Tiket gacha Epic tidak cukup", status_code=400)
        # Ticket rolls guarantee high tier rewards and don't affect standard pity
        new_pity_counter = pity_counter
        
        # Roll Epic (80%) or Legendary (20%)
        r = random.uniform(0, 1)
        if r < 0.20:
            reward_rarity = "Legendary"
        else:
            reward_rarity = "Epic"
    else:
        if coins < COIN_COST:
            raise GachaError("Koin tidak cukup untuk melakukan gacha", status_code=400)
        
        new_pity_counter = pity_counter + 1
        PITY_THRESHOLD = 60
        if new_pity_counter >= PITY_THRESHOLD:
            reward_rarity = "Legendary"
            new_pity_counter = 0
        else:
            r = random.uniform(0, 1)
            if r < 0.03:
                reward_rarity = "Legendary"
                new_pity_counter = 0
            elif r < 0.15:
                reward_rarity = "Epic"
            elif r < 0.40:
                reward_rarity = "Rare"
            else:
                reward_rarity = "Common"

    # Ticket rolls only yield cards, no resources!
    if use_ticket:
        reward_type = "card"
        reward_amount = 0
    else:
        sub_r = random.uniform(0, 1)
        reward_type = "card"
        reward_amount = 0
        if reward_rarity == "Legendary":
            if sub_r < 0.70: reward_type = "card"
            elif sub_r < 0.85: reward_type = "coins"; reward_amount = 500
            else: reward_type = "exp"; reward_amount = 1000
        elif reward_rarity == "Epic":
            if sub_r < 0.75: reward_type = "card"
            elif sub_r < 0.88: reward_type = "coins"; reward_amount = 250
            else: reward_type = "exp"; reward_amount = 500
        elif reward_rarity == "Rare":
            if sub_r < 0.80: reward_type = "card"
            elif sub_r < 0.90: reward_type = "coins"; reward_amount = 100
            else: reward_type = "exp"; reward_amount = 200
        else: # Common
            if sub_r < 0.85: reward_type = "card"
            elif sub_r < 0.93: reward_type = "coins"; reward_amount = 50
            else: reward_type = "exp"; reward_amount = 100

    if reward_type == "card":
        try:
            card = get_random_card_by_rarity(reward_rarity)
        except ValueError:
            try:
                card = get_random_card_by_rarity("Common")
                reward_rarity = "Common"
            except Exception as inner_e:
                raise GachaError(f"Database error: Gacha catalog is empty: {inner_e}", status_code=500)

        reward_detail = {
            "card_id": card["id"],
            "name": card["name"],
            "description": card["description"],
            "quote": card["quote"],
            "image_url": card["image_url"]
        }
        reward_name = card["name"]
    else:
        reward_detail = {
            "amount": reward_amount
        }
        reward_name = f"+{reward_amount} {reward_type.upper()}"

    # 6. Execute gacha transaction in Supabase DB
    try:
        transaction_result = execute_gacha_transaction(
            user_id=user_id,
            cost=COIN_COST,
            pity_counter=new_pity_counter,
            reward_type=reward_type,
            reward_rarity=reward_rarity,
            reward_detail=reward_detail,
            use_ticket=use_ticket
        )
    except Exception as e:
        raise GachaError(f"Gacha transaction failed on database: {e}", status_code=500)

    return {
        "reward_type": reward_type,
        "reward_rarity": reward_rarity,
        "reward_name": reward_name,
        "reward_detail": reward_detail,
        "new_coins": transaction_result.get("new_coins", coins if use_ticket else coins - COIN_COST),
        "new_pity": transaction_result.get("pity_counter", new_pity_counter),
        "new_tickets": transaction_result.get("new_tickets", epic_tickets - 1 if use_ticket else epic_tickets)
    }

