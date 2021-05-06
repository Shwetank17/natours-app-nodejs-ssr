exports.getOverview = (req, res, next) => {
  // telling express to render the pug template named 'overview' when '/overview' route is invoked
  res.status(200).render('overview', {
    title: 'Park Camper'
  });
};

exports.getTour = (req, res, next) => {
  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour'
  });
};
