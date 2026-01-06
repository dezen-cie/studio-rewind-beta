import './BackgroundVideo.css'

function  BackgroundVideo(){

    return(
        <div className="video-background">
            <video autoPlay muted loop playsInline>
                <source 
                    src="/videos/header-small.mp4" type="video/mp4"
                    media="(max-width: 599px)"
                />
                <source 
                    src="/videos/header-full.mp4" type="video/mp4" 
                    media="(min-width: 600px)"
                />
            </video>
        </div>
    )
}

export default BackgroundVideo