import { useState } from "react";
import { careerRoles, userSkills } from "../data/careerData";
import { simulateSkillChange } from "../utils/scenarioSimulator";

export default function ScenarioSimulator() {
  const [skill, setSkill] = useState("Python");
  const [value, setValue] = useState(userSkills.Python);

  const results = simulateSkillChange(
    userSkills,
    careerRoles,
    skill,
    value
  );

  const initialValue = userSkills[skill] ?? 0;
  const deltaValue = value - initialValue;

  return (
    <section className="scenario-simulator" id="simulator">
      <div className="scenario-header">
        <div>
          <span className="section-label">Career Scenario Simulation</span>
          <h2>Skill Impact Simulator</h2>
          <p>
            Simulate how improving or adjusting a specific skill changes your relative career alignment scores in real time.
          </p>
        </div>
      </div>

      <div className="scenario-controls">
        <div className="control-group">
          <label htmlFor="skill-select">Select Skill</label>
          <select
            id="skill-select"
            value={skill}
            onChange={(e) => {
              const selectedSkill = e.target.value;
              setSkill(selectedSkill);
              setValue(userSkills[selectedSkill]);
            }}
          >
            {Object.keys(userSkills).map((item) => (
              <option key={item} value={item}>
                {item} (Baseline: {userSkills[item]}%)
              </option>
            ))}
          </select>
        </div>

        <div className="control-group slider-group">
          <div className="slider-label-row">
            <label>
              Simulated {skill} Level: <strong>{value}%</strong>
            </label>
            {deltaValue !== 0 && (
              <span className={`delta-badge ${deltaValue > 0 ? 'positive' : 'negative'}`}>
                {deltaValue > 0 ? `+${deltaValue}%` : `${deltaValue}%`} from baseline
              </span>
            )}
          </div>

          <input
            className="skill-slider"
            type="range"
            min="0"
            max="100"
            value={value}
            style={{ "--progress": `${value}%` }}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="scenario-disclaimer">
        <p>
          💡 <strong>Simulation Note:</strong> This models relative skill alignment based on candidate profile adjustments. Setting a skill level to 0% applies a weighted penalty for that requirement in the scoring formula — it does not mean 0% overall qualification or zero hiring likelihood.
        </p>
      </div>

      <div className="scenario-results">
        {results.map((result) => (
          <div className="scenario-result-card" key={result.role}>
            <div className="result-role-info">
              <strong>{result.role}</strong>
              <span>Target Role</span>
            </div>

            <div className="scenario-scores">
              <div className="score-comparison">
                <span className="score-baseline">{result.currentMatch}%</span>
                <span className="score-arrow">→</span>
                <span className="score-simulated">{result.simulatedMatch}%</span>
              </div>

              {result.improvement !== 0 && (
                <span className={`impact-badge ${result.improvement > 0 ? 'positive' : 'negative'}`}>
                  {result.improvement > 0 ? `+${result.improvement}%` : `${result.improvement}%`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}