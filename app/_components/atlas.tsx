import { ArrowRight, ArrowUpRight, Grid2X2, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { scenarios, sourceUrl, type Scenario } from '../futures';
import { externalLink, twoDigits } from './format';

const outsideMap = scenarios.find((s) => s.id === 'self-destruction')!;
const mapped = scenarios.filter((s) => s !== outsideMap);

type AtlasProps = {
  matchIds: Set<string>;
  onSelect: (scenario: Scenario) => void;
};

export function Atlas({ matchIds, onSelect }: AtlasProps) {
  return (
    <section
      id="futures"
      className="atlas-section"
      aria-labelledby="atlas-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 / THE POSSIBILITY SPACE</p>
          <h2 id="atlas-title">
            Twelve futures.
            <br />
            <span>No single destination.</span>
          </h2>
        </div>
        <div className="section-aside">
          <p>
            Explore the worlds in Max Tegmark’s <em>Life 3.0</em>. Select a
            future to see its central idea and a question worth asking.
          </p>
          <p>
            These thought experiments can overlap. They are neither exhaustive
            nor forecasts.{' '}
            <a href={sourceUrl} {...externalLink}>
              Read the original <ArrowUpRight size={14} />
            </a>
          </p>
        </div>
      </div>
      <Tabs defaultValue="map" className="atlas-tabs">
        <div className="atlas-toolbar">
          <TabsList aria-label="Atlas view" className="view-tabs">
            <TabsTrigger value="map">
              <Grid2X2 size={16} /> Map of futures
            </TabsTrigger>
            <TabsTrigger value="list">
              <List size={17} /> All 12 scenarios
            </TabsTrigger>
          </TabsList>
          <div className="legend">
            <span>
              <i /> Discussion scenarios
            </span>
            <span className="warning">
              <i /> Warning scenarios
            </span>
            {matchIds.size > 0 && (
              <span className="match">
                <i /> Your matches
              </span>
            )}
          </div>
        </div>
        <TabsContent value="map">
          <FuturesMap matchIds={matchIds} onSelect={onSelect} />
        </TabsContent>
        <TabsContent value="list">
          <ScenarioList matchIds={matchIds} onSelect={onSelect} />
        </TabsContent>
      </Tabs>
      <p className="atlas-note">
        The scenario names and concise summaries follow{' '}
        <a href={sourceUrl} {...externalLink}>
          FLI’s guide to Tegmark <ArrowUpRight size={13} />
        </a>
        . Warning labels, questions, positions, and matching profiles are
        editorial choices for this exploration.
      </p>
    </section>
  );
}

function FuturesMap({ matchIds, onSelect }: AtlasProps) {
  return (
    <>
      <div
        className="map-scroll"
        role="region"
        aria-label="Interactive AI futures map. Scroll horizontally on smaller screens, or use All 12 scenarios."
        tabIndex={0}
      >
        <div className="map-canvas">
          <div className="axis-y-title">WHO HAS FINAL AUTHORITY?</div>
          <span className="axis-human">HUMANS</span>
          <span className="axis-ai">AI / SUCCESSORS</span>
          <div className="map-plot">
            <div className="map-grid" aria-hidden="true" />
            {mapped.map((s) => (
              <MapNode
                key={s.id}
                scenario={s}
                isMatch={matchIds.has(s.id)}
                onSelect={onSelect}
              />
            ))}
          </div>
          <div className="axis-x">
            <span>LITTLE OR NO AI</span>
            <span>
              HOW MUCH AI CAPABILITY? <ArrowRight size={15} />
            </span>
            <span>VERY HIGH</span>
          </div>
        </div>
      </div>
      <div className="map-foot">
        <button className="outside-map" onClick={() => onSelect(outsideMap)}>
          <span className="warning-dot" />
          <span>
            <strong>Self-destruction</strong>
            <small>Outside the axes: no continuing society.</small>
          </span>
          <ArrowUpRight size={20} />
        </button>
        <p>
          Positions are an editorial sketch, not measurements. Mixed authority
          and transitions are simplified. Adapted from{' '}
          <a
            href="https://thorehusfeldt.com/2018/05/25/superintelligence-in-sf-part-iii-aftermaths/"
            {...externalLink}
          >
            Thore Husfeldt’s map <ArrowUpRight size={13} />
          </a>
          .
        </p>
      </div>
    </>
  );
}

type MapNodeProps = {
  scenario: Scenario;
  isMatch: boolean;
  onSelect: (scenario: Scenario) => void;
};

function MapNode({ scenario, isMatch, onSelect }: MapNodeProps) {
  const isWarning = !scenario.profile;

  return (
    <button
      className={`map-node ${isWarning ? 'warning' : ''} ${isMatch ? 'matched' : ''}`}
      style={{ left: `${scenario.x}%`, top: `${scenario.y}%` }}
      onClick={() => onSelect(scenario)}
      aria-label={`Explore ${scenario.name}${isWarning ? ', warning scenario' : ''}${isMatch ? ', one of your matches' : ''}`}
    >
      <span className="node-dot" />
      <span>{scenario.name}</span>
      {isMatch && <span className="node-match-label">YOUR MATCH</span>}
    </button>
  );
}

function ScenarioList({ matchIds, onSelect }: AtlasProps) {
  return (
    <div className="scenario-list">
      {scenarios.map((s, i) => {
        const isWarning = !s.profile;
        const isMatch = matchIds.has(s.id);
        return (
          <button
            key={s.id}
            className={`scenario-row ${isWarning ? 'warning' : ''} ${isMatch ? 'matched' : ''}`}
            onClick={() => onSelect(s)}
          >
            <span className="row-number">{twoDigits(i + 1)}</span>
            <span className="row-name">
              {s.name}
              {isMatch && <small>YOUR MATCH</small>}
              {isWarning && <small>WARNING SCENARIO</small>}
            </span>
            <span className="row-summary">{s.summary}</span>
            <ArrowUpRight size={22} />
          </button>
        );
      })}
    </div>
  );
}
