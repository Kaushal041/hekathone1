import React from "react";

const RankedWorkers = ({ rankedWorkers = [] }) => {
  const topThreeWorkerIds = new Set(
    rankedWorkers.slice(0, 3).map((worker) => String(worker.bidId))
  );

  return (
    <div className="bidsSection">
      <h2>Received Bids</h2>
      {rankedWorkers.length > 0 && <p>Top 3 workers are highlighted below.</p>}
      {rankedWorkers.length === 0 && (
        <div className="bidCard">
          <p>No bids available yet for this job.</p>
        </div>
      )}

      {rankedWorkers.map((bid) => (
        <div className="bidCard" key={bid.bidId}>
          <div className="bidHeader">
            <div>
              <h3>{bid.workerName}</h3>
              <p>
                ⭐ {bid.rating} · {bid.completedJobs} completed jobs
              </p>
            </div>
            <div className="bidBadges">
              {bid.recommended && <span className="recommendedBadge">Recommended</span>}
              {bid.rank === 1 && <span className="bestMatchBadge">Best Match</span>}
              {topThreeWorkerIds.has(String(bid.bidId)) && (
                <span className="recommendedBadge">Top 3</span>
              )}
            </div>
          </div>

          <p className="bidProposal">{bid.proposal}</p>

          <div className="bidScores">
            <span>Performance Score: {bid.performanceScore}</span>
            <span>Reputation Score: {bid.reputationScore}</span>
            <span>Skill Match Score: {bid.skillMatchScore}</span>
            <span>Price Score: {bid.priceScore}</span>
            <span>Location Score: {bid.locationScore}</span>
            <span>Final AI Score: {bid.aiScore}</span>
          </div>

          <p className="bidReason">Reason: {bid.recommendationReason}</p>

          <div className="bidAmount">Bid Amount: INR {bid.bidAmount}</div>
        </div>
      ))}
    </div>
  );
};

export default RankedWorkers;
