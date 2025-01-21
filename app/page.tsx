// app/page.tsx

import Marquee from "./page/components/about_us/marquee";
import AboutUs from "./page/views/about/about-us";
import Main from "./page/views/main/main";


export default function Home() {
  return (
    <>
      <Main />
      <Marquee />
      <AboutUs />
    </>
  );
}
