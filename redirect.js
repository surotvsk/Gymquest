/* GymQuest moved to /Gym-Lift/ — keep the rest of the address (path, ?query, #hash). */
(function () {
  var p = location.pathname, i = p.toLowerCase().indexOf('/gymquest/');
  var rest = i >= 0 ? p.slice(i + '/gymquest/'.length) : '';
  location.replace('/Gym-Lift/' + rest + location.search + location.hash);
})();
