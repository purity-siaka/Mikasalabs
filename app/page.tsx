import Logo from "@/components/Logo";
import { SITE } from "@/lib/site";
import { submitEnquiry } from "./actions";

const divisions = [
  ["Software development", "Websites, web and mobile apps, dashboards and custom management systems that solve real problems."],
  ["Artificial intelligence", "Intelligent systems that learn, reason and create impact, built responsibly."],
  ["Academy", "Practical technology education for students, beginners and professionals."],
  ["Cybersecurity", "Protecting systems, data and people in an increasingly digital world."],
  ["Research and innovation", "Exploring ideas, building prototypes and creating the future through research."],
  ["Products", "Our own software, designed to simplify operations and improve lives."],
];
const courses = [["Python", "Logic, problem-solving and your first real projects."], ["Networking", "How networks work, practised hands-on."], ["Full-stack projects", "Build a complete web app from interface to deployment."]];
const interests = ["Software development", "Artificial intelligence", "Cybersecurity", "Research and innovation", "Academy classes", "Products", "Something else"];

export default async function Home({ searchParams }: { searchParams: Promise<{ sent?: string; e?: string }> }) {
  const { sent, e } = await searchParams;
  return (
    <>
      <header className="nav"><div className="wrap">
        <a className="brand" href="#top"><Logo onLight /><span>MIKASA<small>LABS</small></span></a>
        <ul><li><a href="#services">Solutions</a></li><li><a href="#academy">Academy</a></li><li><a href="#about">About</a></li><li><a href="#contact">Contact</a></li></ul>
        <div className="row"><a className="btn ghost" href="/login">Client login</a><a className="btn" href="#contact">Build with us</a></div>
      </div></header>

      <main id="top">
        <section className="hero"><div className="wrap">
          <div>
            <div className="eyebrow">INNOVATION &nbsp;|&nbsp; PEOPLE &nbsp;|&nbsp; IMPACT</div>
            <h1>Technology<span>Without Limits</span></h1>
            <p>We build intelligent solutions, advance AI and empower innovators to solve real world problems.</p>
            <div className="row"><a className="btn" href="#services">Explore our solutions</a><a className="btn ghost" href="#academy">Start learning</a></div>
          </div>
          <div style={{ justifySelf: "center", filter: "drop-shadow(0 20px 50px #2E8BFF66)" }}><Logo size={250} /></div>
        </div></section>

        <section className="sec" id="services"><div className="wrap">
          <h2>What we do</h2><p className="lead">Six areas, one goal: practical technology that makes a real difference.</p>
          <div className="g3">{divisions.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p className="mute" style={{ fontSize: 16, margin: 0 }}>{d}</p></div>)}</div>
        </div></section>

        <section className="sec alt" id="academy"><div className="wrap">
          <h2>Mikasa Labs Academy</h2>
          <p className="lead">Learn by building. Classes run online on weekends and evenings. This is practical training, not an accredited qualification. Dates and fees are shared on enquiry.</p>
          <div className="g3">{courses.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p className="mute" style={{ fontSize: 16, margin: 0 }}>{d}</p></div>)}</div>
          <p style={{ marginTop: 20 }}><a className="btn" href="#contact">Join the Academy list</a></p>
        </div></section>

        <section className="sec" id="about"><div className="wrap two">
          <div><h2>Where we are headed</h2>
            <h3 style={{ marginTop: 28 }}>Vision</h3><p className="mute" style={{ fontSize: 16 }}>To build a lasting African technology company that develops useful solutions, advances innovation and creates opportunities for people and businesses.</p>
            <h3 style={{ marginTop: 22 }}>Mission</h3><p className="mute" style={{ fontSize: 16 }}>To turn ideas and real-world challenges into practical technology solutions, while developing skills and making technology more useful and accessible.</p></div>
          <div className="card"><h3>What we stand for</h3><ul className="list"><li>Innovation and problem-solving</li><li>Quality, integrity and responsibility</li><li>Learning and opportunity</li><li>Long-term thinking</li></ul>
            <p className="mute" style={{ marginTop: 18 }}>“Innovation is not about ideas. It’s about making ideas happen.” Purity Siaka, Founder and CEO</p></div>
        </div></section>

        <section className="sec alt" id="contact"><div className="wrap two">
          <div><h2>Let’s build the future together</h2>
            <p className="lead">Tell us what is taking too much time or costing too much. We reply with honest next steps.</p>
            <div className="row"><a className="btn" href={`https://wa.me/${SITE.whatsapp}`}>WhatsApp {SITE.phoneDisplay}</a><a className="btn ghost" href={`mailto:${SITE.email}`}>{SITE.email}</a></div></div>
          <form action={submitEnquiry} className="card" style={{ padding: 22 }}>
            {sent && <div className="ok" role="status">Thank you. We have your enquiry and will reply soon.</div>}
            {e && <div className="err" role="alert">Please add your name, a valid email, a message of at least 10 characters, and tick the consent box.</div>}
            <div className="row" style={{ marginBottom: 12 }}><input name="name" placeholder="Your name" aria-label="Your name" required /><input name="email" type="email" placeholder="Email" aria-label="Email" required /></div>
            <div className="row" style={{ marginBottom: 12 }}><input name="phone" placeholder="Phone (optional)" aria-label="Phone" /><select name="interest" aria-label="Interested in">{interests.map((i) => <option key={i}>{i}</option>)}</select></div>
            <p style={{ margin: "0 0 12px" }}><textarea name="message" rows={4} placeholder="How can we help?" aria-label="Message" required style={{ width: "100%" }} /></p>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
            <label className="mute" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14 }}><input type="checkbox" name="consent" style={{ flex: "0 0 auto", width: 18 }} />I agree that Mikasa Labs may store these details to reply to my enquiry.</label>
            <button>Send enquiry</button>
          </form>
        </div></section>
      </main>
      <footer className="foot"><div className="wrap row between"><span>© 2026 Mikasa Labs. Technology Without Limits.</span><span>{SITE.location} · <a href="/login">Client login</a></span></div></footer>
    </>
  );
}
