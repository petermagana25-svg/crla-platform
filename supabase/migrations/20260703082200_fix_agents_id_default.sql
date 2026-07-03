-- Fix missing UUID default on agents.id
-- Safe to run even if the default was already added manually.

ALTER TABLE public.agents
ALTER COLUMN id
SET DEFAULT gen_random_uuid();
