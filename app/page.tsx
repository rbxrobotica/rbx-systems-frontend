// app/page.tsx

import Marquee from "./page/components/about_us/marquee";
import AboutUs from "./page/views/about/about-us";
import ContactSection from "./page/views/contact/contact-section";
import Footer from "./page/views/footer/footer";
import Main from "./page/views/main/main";
import { getLocaleFromHeaders } from "@/lib/i18n/getLocaleFromHeaders";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/getDictionary";
import type { Dictionary } from "@/lib/i18n/types";


export default async function Home() {
  const locale = getLocaleFromHeaders() as Locale;
  const dict = (await getDictionary(locale)) as Dictionary;

  return (
    <>
      <Main dict={dict} />
      <Marquee />
      <AboutUs dict={dict} />
      <ContactSection dict={dict} />
      <Footer dict={dict} />
    </>
  );
}
