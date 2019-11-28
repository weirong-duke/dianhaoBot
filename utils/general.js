const normalizeScore = (t) => {
  return (t / (1 + Math.abs(t)));
};

exports.normalizeScore = normalizeScore;
