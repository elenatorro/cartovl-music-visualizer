const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-0.15900444266446812, 39.83344428471585],
  zoom: 5.2,
  dragRotate: false,
  touchZoomRotate: false
});

carto.setDefaultAuth({
  user: 'elena-carto',
  apiKey: 'default_public'
});

const source = new carto.source.Dataset('nightclubs_spain');
const viz = new carto.Viz(`
  width: 15
  strokeWidth: 8
  strokeColor: opacity(blue, 0.9)
  color: opacity(blue, 0.5)
`);

const layer = new carto.Layer('layer', source, viz);

layer.addTo(map, 'watername_ocean');

const file = document.getElementById("thefile");
const audio = document.getElementById("audio");
const context = new AudioContext();
let animationFrameId;
let src = context.createMediaElementSource(audio);

function loadSong(fileSrc, musicType) {
  const FFT_SIZE = 256;
  var analyser = context.createAnalyser();
  var lastColor;
  var lastWidth;
  var lastStrokeWidth;

  audio.src = fileSrc;
  audio.load();
  audio.play();

  src.connect(analyser);
  analyser.connect(context.destination);

  analyser.fftSize = FFT_SIZE;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function startAnimation() {
    animationFrameId = requestAnimationFrame(startAnimation);

    analyser.getByteFrequencyData(dataArray);

    var frequency = dataArray[10];

    lastWidth = `linear(${frequency}, 0, 255) * 50`;
    lastStrokeWidth = `linear(${frequency}, 0, 255) * 8`;
    lastColor = `rgb(
                      torque(0.5, 5, fade(2.5, 2.5)) * 255,
                      torque(0.5, 3, fade(1.5, 1.5)) * 255,
                      torque(0.5, 7, fade(3.5, 3.5)) * 255
                    )`;

    layer.blendToViz(new carto.Viz(`
        width: ${lastWidth}
        strokeWidth: 8
        strokeColor: opacity(${lastColor}, 0.9)
        color: opacity(${lastColor}, 0.5)
        filter: eq($music_type, '${musicType}') or false
      `), 0);
}

  audio.addEventListener('play', onPlay);
  audio.addEventListener('pause', onPause);

  startAnimation();
};

function onPause() {
  stopAnimation(animationFrameId);
}

function onPlay() {
  audio.play();
}

function stopAnimation(animationFrameId) {
  window.cancelAnimationFrame(animationFrameId)

  layer.blendToViz(new carto.Viz(`
    width: 15
    strokeWidth: 8
    strokeColor: opacity(blue, 0.9)
    color: opacity(blue, 0.5)
  `));
};

function stopSong(animationFrameId) {
  if (animationFrameId) {
    stopAnimation(animationFrameId);
    audio.pause();
    audio.currentTime = 0;
    audio.removeEventListener('play', onPlay);
    audio.removeEventListener('pause', onPause);
  }
};

const $musicSelectorButtons = document.querySelectorAll('.button-music-selector');

$musicSelectorButtons.forEach(function ($button, index) {

  $button.addEventListener('click', function (event) {
    var musicType = event.target.getAttribute('data-music-type');
    var audioFormat = event.target.getAttribute('data-music-format');

    $musicSelectorButtons.forEach(function ($button) {
      $button.classList.remove('selected');
    });

    $button.classList.add('selected');

    stopSong(animationFrameId);
    loadSong(`https://raw.githubusercontent.com/elenatorro/cartovl-music-visualizer/master/songs/${musicType}.${audioFormat}`, musicType);
  });
});
