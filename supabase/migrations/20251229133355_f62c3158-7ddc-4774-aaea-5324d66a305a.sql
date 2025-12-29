-- Delete test boards and blocks for user c67112be-e9b0-43e1-8cd0-e9ead7d19145
DELETE FROM public.messages WHERE user_id = 'c67112be-e9b0-43e1-8cd0-e9ead7d19145';
DELETE FROM public.blocks WHERE user_id = 'c67112be-e9b0-43e1-8cd0-e9ead7d19145';
DELETE FROM public.boards WHERE user_id = 'c67112be-e9b0-43e1-8cd0-e9ead7d19145';

-- Also reset their subscription data so they can test fresh
DELETE FROM public.subscriptions WHERE user_id = 'c67112be-e9b0-43e1-8cd0-e9ead7d19145';
DELETE FROM public.subscription_entitlements WHERE user_id = 'c67112be-e9b0-43e1-8cd0-e9ead7d19145';
DELETE FROM public.subscription_addons WHERE user_id = 'c67112be-e9b0-43e1-8cd0-e9ead7d19145';
DELETE FROM public.user_billing WHERE user_id = 'c67112be-e9b0-43e1-8cd0-e9ead7d19145';