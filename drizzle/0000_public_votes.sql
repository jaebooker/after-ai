CREATE TABLE public_votes (
  voter_hash TEXT PRIMARY KEY NOT NULL,
  scenario_id TEXT NOT NULL CHECK (scenario_id IN ('libertarian','benevolent','egalitarian','gatekeeper','protector','enslaved','descendants','reversion','conquerors','zookeeper','1984','self-destruction'))
);
--> statement-breakpoint
CREATE INDEX public_votes_scenario_idx ON public_votes(scenario_id);
