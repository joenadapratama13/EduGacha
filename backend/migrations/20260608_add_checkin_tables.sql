-- Add check-in and ticket columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_checkin_date DATE,
ADD COLUMN IF NOT EXISTS epic_tickets INTEGER DEFAULT 0 NOT NULL;

-- Create check-in history logs table
CREATE TABLE IF NOT EXISTS public.checkin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    coins_rewarded INTEGER NOT NULL DEFAULT 0,
    tickets_rewarded INTEGER NOT NULL DEFAULT 0,
    checked_in_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_checkin_date UNIQUE (user_id, checked_in_date)
);

-- Create/update RPC for transaction safety when rolling gacha with tickets
CREATE OR REPLACE FUNCTION public.execute_gacha_transaction(
    p_user_id UUID,
    p_cost INTEGER,
    p_pity_counter INTEGER,
    p_reward_type TEXT,
    p_reward_rarity TEXT,
    p_reward_detail JSONB,
    p_use_ticket BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
    v_coins INTEGER;
    v_tickets INTEGER;
    v_new_coins INTEGER;
    v_new_tickets INTEGER;
    v_card_id UUID;
BEGIN
    -- Fetch current values
    SELECT coins, epic_tickets INTO v_coins, v_tickets FROM public.profiles WHERE id = p_user_id;
    
    IF p_use_ticket THEN
        IF v_tickets < 1 THEN
            RAISE EXCEPTION 'Tiket gacha Epic tidak cukup';
        END IF;
        v_new_coins := v_coins;
        v_new_tickets := v_tickets - 1;
    ELSE
        IF v_coins < p_cost THEN
            RAISE EXCEPTION 'Koin tidak cukup untuk melakukan gacha';
        END IF;
        v_new_coins := v_coins - p_cost;
        v_new_tickets := v_tickets;
    END IF;

    -- Update user profile
    UPDATE public.profiles 
    SET coins = v_new_coins,
        pity_counter = p_pity_counter,
        epic_tickets = v_new_tickets
    WHERE id = p_user_id;

    -- Insert into user_cards if card is won
    IF p_reward_type = 'card' THEN
        v_card_id := (p_reward_detail->>'card_id')::UUID;
        INSERT INTO public.user_cards(user_id, card_id)
        VALUES (p_user_id, v_card_id);
    END IF;

    -- Log to gacha_history
    INSERT INTO public.gacha_history(user_id, reward_type, reward_rarity, reward_detail, pity_count_at)
    VALUES (p_user_id, p_reward_type, p_reward_rarity, p_reward_detail, p_pity_counter);

    RETURN jsonb_build_object(
        'new_coins', v_new_coins,
        'pity_counter', p_pity_counter,
        'new_tickets', v_new_tickets
    );
END;
$$ LANGUAGE plpgsql;
