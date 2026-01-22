-- Add practice statistics columns to attempts table
ALTER TABLE public.attempts
ADD COLUMN timer_enabled boolean DEFAULT false,
ADD COLUMN timer_minutes integer,
ADD COLUMN time_remaining_seconds integer,
ADD COLUMN pause_count integer DEFAULT 0,
ADD COLUMN max_pauses integer,
ADD COLUMN total_paused_ms integer DEFAULT 0,
ADD COLUMN total_characters integer DEFAULT 0,
ADD COLUMN answered_parts_count integer,
ADD COLUMN total_parts_count integer;

-- Add comment to document the columns
COMMENT ON COLUMN public.attempts.timer_enabled IS 'Whether timer was enabled for this practice session';
COMMENT ON COLUMN public.attempts.timer_minutes IS 'Total timer duration configured in minutes';
COMMENT ON COLUMN public.attempts.time_remaining_seconds IS 'Seconds remaining when submitted';
COMMENT ON COLUMN public.attempts.pause_count IS 'Number of pauses used during practice';
COMMENT ON COLUMN public.attempts.max_pauses IS 'Maximum pauses allowed for this session';
COMMENT ON COLUMN public.attempts.total_paused_ms IS 'Total time spent paused in milliseconds';
COMMENT ON COLUMN public.attempts.total_characters IS 'Total characters written across all answers';
COMMENT ON COLUMN public.attempts.answered_parts_count IS 'Number of question parts answered';
COMMENT ON COLUMN public.attempts.total_parts_count IS 'Total number of question parts';