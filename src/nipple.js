<><script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.7.3/nipplejs.js"></script><div id="zone_joystick" style="position: relative;"></div></>

createJoystick = function () {
    var options = {
      zone: document.getElementById('zone_joystick'),
      threshold: 0.1,
      position: { left: 50 + '%' },
      mode: 'static',
      size: 150,
      color: '#000000',
    };
    manager = nipplejs.create(options);

    linear_speed = 0;
    angular_speed = 0;

    self.manager.on('start', function (event, nipple) {
      console.log("Movement start");
    });

    self.manager.on('move', function (event, nipple) {
      console.log("Moving");
    });

    self.manager.on('end', function () {
      console.log("Movement end");
    });
  }
  window.onload = function () {
    createJoystick();
  }