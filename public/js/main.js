const bingKey = "AjhB5DSqKwt7hdMeYtkehPviZ8izcW9xNgKzI18tfqBzGgt8t6UUlyVP-l5VYuD2";
Cesium.BingMapsApi.defaultKey = bingKey;
var viewer = new Cesium.Viewer('cesiumContainer', {

    animation: true, // related to the animation
    timeline: false,
    scene3DOnly: true,
    fullscreenButton: true,
    navigationHelpButton: false,
    // baseLayerPicker: false,
    // terrainProvider: new EllipsoidTerrainProvider()
});

//add cesium inspector widget
viewer.extend(Cesium.viewerCesiumInspectorMixin);

var terrainProvider = new Cesium.CesiumTerrainProvider({

    //https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles
    //https://cesiumjs.org/data-and-assets/terrain/stk-world-terrain/
    url: '//assets.agi.com/stk-terrain/world',
    // requestVertexNormals: true
});
//HACK: cuz terrain is very ugly, so we may not set the terrainprovider.
// viewer.terrainProvider = terrainProvider;

// set home button default view instead of flying to the world
setHomeButtonView(Cesium);

function setHomeButtonView(Cesium) {

    // set home button default view
    const west = 114.173746;
    const south = 22.301674;
    const east = 114.185974;
    const north = 22.307335;

    const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

    //Cesium.Camera.DEFAULT_OFFSET = new Cesium.HeadingPitchRange(Cesium.Math.toRadians(295.04946043173993), Cesium.Math.toRadians(-44.81296187020527));
    Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;
}

//fly to hk polyU
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.17989587474729, 22.304069958432294, 1216.7704213780498),
    orientation: {
        heading: Cesium.Math.toRadians(360),
        pitch: Cesium.Math.toRadians(-89.9999979086902),
        roll: 0.0
    }
});

viewer.canvas.addEventListener('click', function (e) {
    const mousePosition = new Cesium.Cartesian2(e.clientX, e.clientY);
    const ellipsoid = viewer.scene.globe.ellipsoid;
    const cartesian = viewer.camera.pickEllipsoid(mousePosition, ellipsoid);
    if (cartesian) {
        const cartographic = ellipsoid.cartesianToCartographic(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
        const height = cartographic.height.toFixed(3);

        //set mouse position of longitude,latitude
        $('#inputLongitude').val(longitude)
        $('#inputLatitude').val(latitude)

        //HACK: set mouse altitude by promise
        //get the altitude of mouse position by sampleTerrainMostDetailed
        const promise = Cesium.sampleTerrainMostDetailed(terrainProvider, [Cesium.Cartographic.fromDegrees(parseFloat(longitude), parseFloat(latitude))]);
        promise.then(function (positions) {
            //console.log(positions[0].height);
            $('#inputHeight').val(positions[0].height.toFixed(2))
        }).otherwise(function (error) {
            console.log(error);
            $('#inputHeight').val(0)
        });
    } else {
        alert('Globe was not picked');
    }
}, false);


//toolbox
$('#btnRemoveAll').click(() => {
    viewer.entities.removeAll();
})

$('#btnShowCamera').click(() => {
    const cameraPosition = getCurrentCameraPostion();
    const strPostion = "viewer.camera.flyTo({\n\tdestination : Cesium.Cartesian3.fromDegrees(" + cameraPosition.longitude + "," + cameraPosition.latitude + "," + cameraPosition.height + "),\n\t" +
        "orientation : {\n\t\theading : Cesium.Math.toRadians(" + cameraPosition.heading + "),\n\t\tpitch : Cesium.Math.toRadians(" + cameraPosition.pitch + "),\n\t\troll:0.0\n}});";
    console.log(strPostion);
    alert(strPostion);
})

function getCurrentCameraPostion() {
    const cesiumCamera = viewer.scene.camera;
    const position = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cesiumCamera.position);
    const latitude = Cesium.Math.toDegrees(position.latitude);
    const longitude = Cesium.Math.toDegrees(position.longitude);
    const height = position.height;
    const heading = Cesium.Math.toDegrees(cesiumCamera.heading);
    const pitch = Cesium.Math.toDegrees(cesiumCamera.pitch);
    const roll = Cesium.Math.toDegrees(cesiumCamera.roll);
    return {
        latitude: latitude,
        longitude: longitude,
        height: height,
        heading: heading,
        pitch: pitch,
        roll: roll
    }
}


//upload obj model
$('#btnUploadObj').click(() => {

    const files = $('#inputFileObjModel').get(0).files;
    if (files.length == 0) {
        alert('No file, please choose an obj file!')
        return;
    }

    // if not obj file, reset input:file button and alert
    if (!files[0].name.endsWith('.obj')) {
        $('#inputFileObjModel').replaceWith($('#inputFileObjModel').val('').clone(true));
        alert('please upload an OBJ format file!')
        return;
    }

    if (files.length > 0) {
        // create a FormData object which will be sent as the data payload in the
        // AJAX request
        const formData = new FormData();

        // loop through all the selected files and add them to the formData object
        let file = null;
        for (let i = 0; i < files.length; i++) {
            file = files[i];
            // add the files to formData object for the data payload
            formData.append('OBJ', file, file.name);
        }

        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                console.log('upload successful!\n' + data);
            },
            xhr: function () {
                // create an XMLHttpRequest
                var xhr = new XMLHttpRequest();
                return xhr;
            }
        }).done(function (msg) {
            console.log('Nice! finish uploading obj and converting obj file.')
            $("#divDownloadGltf").removeClass('hidden');
        }).fail(function (jqXHR, textStatus) {
            $("#divDownloadGltf").addClass('hidden');
            alert("Upload Obj failed: " + textStatus);
        });
    }
});

$('#inputFileObjModel').on("change", () => {

    //hide divDownloadGltf
    if (!$("#divDownloadGltf").hasClass('hidden')) {
        $("#divDownloadGltf").addClass('hidden');
    }

    const files = $('#inputFileObjModel').get(0).files;
    if (files.length == 0) {

        alert('No file, please choose an obj file!')
        return;
    }

    // if not obj file, reset input:file button and alert
    if (!files[0].name.endsWith('.obj')) {

        $('#inputFileObjModel').replaceWith($('#inputFileObjModel').val('').clone(true));
        alert('please upload an OBJ format file!')
        return;
    }
});


function setModelDefaultParams(
    longitude = 114.178483,
    latitude = 22.302250,
    height = 13,
    heading = 0,
    pitch = 0,
    roll = 0,
    scale = 1
) {

    //model location
    $('#inputLongitude').val(longitude)
    $('#inputLatitude').val(latitude)
    $('#inputHeight').val(height)

    //model rotation degrees
    $('#inputHeading').val(heading)
    $('#inputPitch').val(pitch)
    $('#inputRoll').val(roll)

    //model scale
    $('#inputScale').val(height)
}




//show model with location, orientation, scale
$("#btnShowModel").click(() => {

    //FIXME: for avoiding the error of rendering model in the same location
    if (viewer.entities) {
        //viewer.entities.removeAll();
        //viewer.scene.primitives.removeAll();
    }

    //model location
    let longitude = $('#inputLongitude').val() ? $('#inputLongitude').val() : 114.178483;
    let latitude = $('#inputLatitude').val() ? $('#inputLatitude').val() : 22.302250;
    let height = $('#inputHeight').val() ? $('#inputHeight').val() : 13;

    //model rotation degrees
    let heading = $('#inputHeading').val() ? $('#inputHeading').val() : 0;
    let pitch = $('#inputPitch').val() ? $('#inputPitch').val() : 0;
    let roll = $('#inputRoll').val() ? $('#inputRoll').val() : 0;

    //model scale
    let scale = $('#inputScale').val() ? $('#inputScale').val() : 1;

    //FIXME: WHEN UPLOADING AND CONVERTING A NEW OBJ FILE, browser seems read the previou result.gltf from browser cache.
    //Therefore, the app can only view the first obj converted gltf.
    if (validateParams(longitude, latitude, height, heading, pitch, roll, scale)) {
        addModelByHeadingPitchRollMatrix(longitude, latitude, height, heading, pitch, roll, scale);
    }else{
        alert('Please ensure the obj location and scale parameters are correct.')
    }
})

function validateParams(lon, lat, height, heading, pitch, roll, scale) {

    if (lon > 180 || lon < -180) {
        return false;
    }

    if (lat > 90 || lat < -90) {
        return false;
    }

    if (scale <= 0) {
        return false;
    }

    return true;
}

function addModelByHeadingPitchRollMatrix(lon, lat, height, heading = 0, pitch = 0, roll = 0, scale = 1) {

    //https://stackoverflow.com/questions/30795745/how-to-move-3d-model-on-cesium
    let center = Cesium.Cartesian3.fromDegrees(lon, lat, height);

    //by controling heading,pitch and roll ,we can rotate the model around x,y,z axis
    //https://cesiumjs.org/Cesium/Build/Documentation/HeadingPitchRoll.html,from this page we know
    //Heading is the rotation about the negative z axis.Pitch is the rotation about the negative y axis.Roll is the rotation about the positive x axis
    //HACK: It turns out the rotation directions are not all aligned with the model direction when we take the cesium reference frame as the basis.
    //I found roll(x direction) is the same while pitch(y direction) and heading/yaw(z direction) are just opposite.
    //for generating hpv value , i have included heading and pitch with a minus. so be careful of the hack.
    let hpv = new Cesium.HeadingPitchRoll(-heading * Cesium.Math.PI / 180, -pitch * Cesium.Math.PI / 180, roll * Cesium.Math.PI / 180);

    let modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
        center,
        hpv,
        // Cesium.Ellipsoid.WGS84,
        // Cesium.Transforms.eastNorthUpToFixedFrame,
        // modelMatrix
    );

    let model = viewer.scene.primitives.add(Cesium.Model.fromGltf({
        url: 'uploads/result.gltf',
        show: true, // default
        modelMatrix: modelMatrix,
        scale: scale, // double size
        // minimumPixelSize: 128, // never smaller than 128 pixels
        // maximumScale: 20000, // never larger than 20000 * model size (overrides minimumPixelSize)
        // allowPicking: true, // not pickable
        // debugShowBoundingVolume: false, // default
        // debugWireframe: false
    }));
}

//control input:text when keyboard is triggered.
//onkeypress="return isNumber(event)"
function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ((charCode > 31 && charCode < 48) || charCode > 57) {
        return false;
    }
    return true;
}
