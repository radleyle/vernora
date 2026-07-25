-- Attempts gain the concept tags of the exercise they answered (spec §7.3:
-- progress is stored by concept, not only by lesson). A Postgres text[]
-- keeps the append-only single-row-per-attempt shape.
--
-- Existing rows get an empty array: history from before tagging simply
-- contributes no concept evidence, which is honest.

alter table exercise_attempts
    add column concept_ids text[] not null default '{}';
