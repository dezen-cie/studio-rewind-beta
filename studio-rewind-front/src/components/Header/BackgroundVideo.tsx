import './BackgroundVideo.css'

function BackgroundVideo() {
  return (
    <div className="video-background">
      <video autoPlay muted loop playsInline>
        <source src="/videos/header-full.webm" type="video/webm" />
        <source src="/videos/header-full.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

export default BackgroundVideo