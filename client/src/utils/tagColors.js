export const getTagColor = (tag) => {
  switch (tag) {
    case '#fraud':
      return { bg: 'rgba(235, 59, 59, 0.1)', fg: '#eb3b3b', border: 'rgba(235, 59, 59, 0.2)' };
    case '#phishing':
      return { bg: 'rgba(224, 123, 57, 0.1)', fg: '#e07b39', border: 'rgba(224, 123, 57, 0.2)' };
    case '#malware':
      return { bg: 'rgba(235, 59, 59, 0.1)', fg: '#eb3b3b', border: 'rgba(235, 59, 59, 0.2)' };
    case '#tracking':
      return { bg: 'rgba(223, 171, 1, 0.1)', fg: '#dfab01', border: 'rgba(223, 171, 1, 0.2)' };
    case '#research':
      return { bg: 'rgba(35, 131, 226, 0.1)', fg: '#2383e2', border: 'rgba(35, 131, 226, 0.2)' };
    default:
      return { bg: '#eaeaea', fg: '#666666', border: '#dddddd' };
  }
};
