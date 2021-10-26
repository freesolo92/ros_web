var app = new Vue({
    el: '#app',
    // storing the state of the page
    data: {
        connected: false,
        ros: null,
        ws_address: 'ws://10.81.170.133:9090',
        logs: [],
        message: 'Hello Vue.js!',
        loading: true,
        m: 'Keine Änderung',
        stateStartPosition: false,
        CurrentPoseIndex: -1,
        stateNextPose: false,
        statePlanPose: false,
        clickPlanPose: false,
        stateExecutePlan: false,
        clickExecutePlan: false,
        sampleList: [],
        calibResultTranslation: [],
        calibResultRotation: [],
        c2m_transform_x: 0,
        c2m_transform_y: 0,
        c2m_transform_z: 0,
        c2m_transform_rx: 0,
        c2m_transform_ry: 0,
        c2m_transform_rz: 0,
        c2m_transform_rw: 0,
        g2w_transform_x: 0,
        g2w_transform_y: 0,
        g2w_transform_z: 0,
        g2w_transform_rx: 0,
        g2w_transform_ry: 0,
        g2w_transform_rz: 0,
        g2w_transform_rw: 0,
        sampleIndex: -1,
        
    },
    // helper methods to connect to ROS
    
    methods: {
        connect: function() {
            this.logs.unshift('Connect to rosbridge server!')
            this.ros = new ROSLIB.Ros({
                url: this.ws_address
            })
            this.ros.on('connection', () => {
                this.logs.unshift((new Date()).toTimeString() + ' - Connected!')
                this.connected = true
                this.loading = false
                this.setCamera()
                this.helloROS()
                console.log('Connected! ROS Bridge')
            })
            this.ros.on('error', (error) => {
                this.logs.unshift('Error connecting to websocket server')
                // console.log('Error connecting to websocket server: ', error)
            })
            this.ros.on('close', () => {
                this.connected = false
                this.logs.unshift('Connection to websocker server closed')
                // console.log('Connection to websocket server closed.')
            })
        },
        disconnect: function() {
            this.ros.close()
        },

// TODO: Change topic names
    setTopic: function() {
        this.topic = new ROSLIB.Topic({
            ros: this.ros,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/Twist'
        })
    },
    forward: function() {
        this.message = new ROSLIB.Message({
            linear: { x: 1, y: 0, z: 0, },
            angular: { x: 0, y: 0, z: 0, },
        })
        this.setTopic()
        this.topic.publish(this.message)
        console.log('Push Button forward:' + this.message.linear)
    },
    stop: function() {
        this.message = new ROSLIB.Message({
            linear: { x: 0, y: 0, z: 0, },
            angular: { x: 0, y: 0, z: 0, },
        })
        this.setTopic()
        this.topic.publish(this.message)
    },
    backward: function() {
        this.message = new ROSLIB.Message({
            linear: { x: -1, y: 0, z: 0, },
            angular: { x: 0, y: 0, z: 0, },
        })
        this.setTopic()
        this.topic.publish(this.message)
    },
    turnLeft: function() {
        this.message = new ROSLIB.Message({
            linear: { x: 0.5, y: 0, z: 0, },
            angular: { x: 0, y: 0, z: 0.5, },
        })
        this.setTopic()
        this.topic.publish(this.message)
    },
    turnRight: function() {
        this.message = new ROSLIB.Message({
            linear: { x: 0.5, y: 0, z: 0, },
            angular: { x: 0, y: 0, z: -0.5, },
        })
        this.setTopic()
        this.topic.publish(this.message)
    },

    setCamera: function() {
        this.cameraViewer = new MJPEGCANVAS.MultiStreamViewer({
            divID: 'mjpeg',
            host: '10.81.170.133',
            // host: '192.168.178.24',
            width: 640,
            height: 480,
            topics: ['/camera/color/image_raw', '/aruco_marker', '/detectnet/overlay', '/object_rect'],
            labels: ['Color_Image', 'Aruco_Calib', 'Object_Detection', 'Object_Rect'],
            port: 8080,
        })
    },

    setSubTopic: function() {
        this.topic = new ROSLIB.Topic({
            ros: this.ros,
            name: '/txt_msg',
            messageType: 'std_msgs/String'
        })
    },
    helloROS: function() {
        var ref = this;
        this.setSubTopic()
        this.topic.subscribe(function(m){ref.m = m.data;});
        console.log('Outer: '+ this.m);
    },
// TODO: Define variables in data methode
    serviceCheckStartPosition: function() {
        this.service = new ROSLIB.Service({
            ros: this.ros,
            name: '/my_calibration_eye_on_hand/check_starting_pose',
            serviceType: 'easy_handeye_msgs/CheckStartingPose'
        })
        this.request = new ROSLIB.ServiceRequest()
        var ref = this;
        this.service.callService(this.request, function(stateStartPosition) {
            ref.stateStartPosition = stateStartPosition.can_calibrate
            ref.CurrentPoseIndex = stateStartPosition.target_poses.current_target_pose_index
            console.log('Result for service call on '
              + ref.service.name
              + ': '
              + stateStartPosition.can_calibrate + ' and Index: ' + stateStartPosition.target_poses.current_target_pose_index) ;
          });
        //   console.log('State Outer: ' + this.stateStartPosition)
        //   console.log('Current Index: ' + this.CurrentPoseIndex)
    },

    serviceNextPose: function() {
        this.service = new ROSLIB.Service({
            ros: this.ros,
            name: '/my_calibration_eye_on_hand/select_target_pose',
            serviceType: 'easy_handeye_msgs/SelectTargetPose'
        })
        this.clickPlanPose = false;
        var ref = this;
        this.CurrentPoseIndex =  this.CurrentPoseIndex + 1;
        this.request = new ROSLIB.ServiceRequest({target_pose_index : ref.CurrentPoseIndex}, console.log('Current Index for NextPose: ' + ref.CurrentPoseIndex));
        this.service.callService(this.request, function(stateNextPose) {
            ref.stateNextPose = stateNextPose.success
            console.log('Result for service call on '
              + ref.service.name
              + ': '
              + stateNextPose.success);
          });
        //   console.log('Current Index for NextPose outside: ' + this.CurrentPoseIndex)
    },

    servicePlanPose: function() {
        this.service = new ROSLIB.Service({
            ros: this.ros,
            name: '/my_calibration_eye_on_hand/plan_to_selected_target_pose',
            serviceType: 'easy_handeye_msgs/PlanToSelectedTargetPose'
        })
        console.log("Ich beginne meine Planung")
        this.clickPlanPose = true;
        this.clickExecutePlan = false;
        var ref = this;
        this.request = new ROSLIB.ServiceRequest();
        this.service.callService(this.request, function(statePlanPose) {
            ref.statePlanPose = statePlanPose.success
            console.log('Result for service call on '
              + ref.service.name
              + ': '
              + statePlanPose.success);
              console.log("Jetzt bin ich mit der Planung fertig")
          });
          
    },

    serviceExecutePlan: function() {
        this.service = new ROSLIB.Service({
            ros: this.ros,
            name: '/my_calibration_eye_on_hand/execute_plan',
            serviceType: 'easy_handeye_msgs/ExecutePlan'
        })
        console.log("Ich beginne mit der Ausführung")
        this.clickExecutePlan = true;
        var ref = this;
        this.request = new ROSLIB.ServiceRequest();
        this.service.callService(this.request, function(stateExecutePlan) {
            ref.stateExecutePlan = stateExecutePlan.success
            console.log('Result for service call on '
              + ref.service.name
              + ': '
              + stateExecutePlan.success);
              console.log("Jetzt bin ich mit der Ausführung fertig")
              
          });
          
    },

    serviceTakeSample: function() {
        this.service = new ROSLIB.Service({
            ros: this.ros,
            name: '/my_calibration_eye_on_hand/take_sample',
            serviceType: 'easy_handeye_msgs/TakeSample'
        })
        this.sampleIndex = this.sampleIndex + 1;
        var ref = this;
        this.request = new ROSLIB.ServiceRequest();
        this.service.callService(this.request, function(sampleList) {
            ref.sampleList = sampleList.samples
            // ref.world_sample = sampleList.samples.hand_world_samples
            console.log('Result for service call on '
              + ref.service.name
              + ': '
              + sampleList.samples + " SampleIndex: " + ref.sampleIndex);
              console.log("Type of " + typeof(ref.sampleIndex))
            //   Index = ref.sampleIndex
              ref.c2m_transform_x = sampleList.samples.camera_marker_samples[ref.sampleIndex].translation.x
              ref.c2m_transform_y = sampleList.samples.camera_marker_samples[ref.sampleIndex].translation.y
              ref.c2m_transform_z = sampleList.samples.camera_marker_samples[ref.sampleIndex].translation.z
              ref.c2m_transform_rx = sampleList.samples.camera_marker_samples[ref.sampleIndex].rotation.x
              ref.c2m_transform_ry = sampleList.samples.camera_marker_samples[ref.sampleIndex].rotation.y
              ref.c2m_transform_rz = sampleList.samples.camera_marker_samples[ref.sampleIndex].rotation.z
              ref.c2m_transform_rw = sampleList.samples.camera_marker_samples[ref.sampleIndex].rotation.w

              ref.g2w_transform_x = sampleList.samples.hand_world_samples[ref.sampleIndex].translation.x
              ref.g2w_transform_y = sampleList.samples.hand_world_samples[ref.sampleIndex].translation.y
              ref.g2w_transform_z = sampleList.samples.hand_world_samples[ref.sampleIndex].translation.z
              ref.g2w_transform_rx = sampleList.samples.hand_world_samples[ref.sampleIndex].rotation.x
              ref.g2w_transform_ry = sampleList.samples.hand_world_samples[ref.sampleIndex].rotation.y
              ref.g2w_transform_rz = sampleList.samples.hand_world_samples[ref.sampleIndex].rotation.z
              ref.g2w_transform_rw = sampleList.samples.hand_world_samples[ref.sampleIndex].rotation.w
              console.log("Transform: " + ref.transform_x)
          });
          console.log("Nice to know: " + this.calibResult);
    },

    serviceRemoveSample: function() {
        this.service = new ROSLIB.Service({
            ros: this.ros,
            name: '/my_calibration_eye_on_hand/remove_sample',
            serviceType: 'easy_handeye_msgs/RemoveSample'
        })
        
        var ref = this;
        this.request = new ROSLIB.ServiceRequest({sample_index: ref.sampleIndex});
        this.service.callService(this.request, function(sampleList) {
            ref.sampleList = sampleList.samples
            ref.sampleIndex = ref.sampleIndex - 1;
            console.log('Result for service call on '
              + ref.service.name
              + ': '
              + sampleList.samples + " SampleIndex: " + ref.sampleIndex);
          });
    },
// TODO: Define variables in data methode
// TODO: Define value valid calibration and connect it with disabling SAVE function if value is false
    serviceComputeCalibration: function() {
        this.service = new ROSLIB.Service({
            ros: this.ros,
            name: '/my_calibration_eye_on_hand/compute_calibration',
            serviceType: 'easy_handeye_msgs/ComputeCalibration'
        })
        var ref = this;
        this.request = new ROSLIB.ServiceRequest();
        this.service.callService(this.request, function(MatCalibration) {
            ref.calibResultTranslation = MatCalibration.calibration.transform.transform.translation
            ref.calibResultRotation = MatCalibration.calibration.transform.transform.rotation
            console.log('Result for service call on '
              + ref.service.name
              + ': '
              + MatCalibration.calibration);
          });
    },

    serviceSaveCalibration: function() {
        this.service = new ROSLIB.Service({
            ros: this.ros,
            name: '/my_calibration_eye_on_hand/save_calibration',
            serviceType: 'std_srvs/Empty'
        })
        var ref = this;
        this.request = new ROSLIB.ServiceRequest();
        this.service.callService(this.request, function(SavetCalibration) {
            ref.SavetCalibration = SavetCalibration
            console.log('Result for service call on '
              + ref.service.name
              + ': '
              + SavetCalibration);
          });
    },
        
},

})

