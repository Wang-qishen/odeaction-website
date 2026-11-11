const video = document.querySelector('#film');
const playButton = document.querySelector('#playVideo');
const status = document.querySelector('#playbackStatus');

// Assign the media source only in response to the reader choosing to play.
playButton.addEventListener('click', async () => {
  status.hidden = true;
  playButton.hidden = true;
  video.controls = true;
  if (!video.getAttribute('src')) video.src = video.dataset.src;
  try {
    await video.play();
    video.focus({preventScroll: true});
  } catch {
    playButton.hidden = false;
    status.textContent = 'Playback could not start. Try again or download the video below.';
    status.hidden = false;
  }
});
video.addEventListener('error', () => {
  playButton.hidden = false;
  status.textContent = 'The video could not load. Try again or download it below.';
  status.hidden = false;
});
