import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { ShieldCheck, BookOpen, Users, CheckSquare } from "lucide-react";
import { PUBLICATION } from "../utils/editorial";
import { checkTableExists } from "../utils/cmsService";

export default function About() {
  const [loading, setLoading] = useState(true);
  const [missionOverride, setMissionOverride] = useState("");
  const [boardMembers, setBoardMembers] = useState([]);
  const [counts, setCounts] = useState({
    articles: 0,
    announcements: 0,
    events: 0,
    albums: 0,
  });

  useEffect(() => {
    document.title = `Masthead & Charter | ${PUBLICATION.name}`;
    fetchLiveStats();
  }, []);

  const fetchLiveStats = async () => {
    setLoading(true);
    try {
      const [art, ann, evt, gal, hasSettings] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        checkTableExists("site_settings"),
      ]);

      if (hasSettings) {
        const { data: cfg } = await supabase
          .from("site_settings")
          .select("homepage_config")
          .eq("id", "default")
          .maybeSingle();
        if (cfg?.homepage_config?.aboutMission) {
          setMissionOverride(cfg.homepage_config.aboutMission);
        }
        if (Array.isArray(cfg?.homepage_config?.editorialBoard)) {
          setBoardMembers(cfg.homepage_config.editorialBoard);
        }
      }

      setCounts({
        articles: art.count || 0,
        announcements: ann.count || 0,
        events: evt.count || 0,
        albums: gal.count || 0,
      });
    } catch (err) {
      console.error("Failed to retrieve publication records:", err);
    } finally {
      setLoading(false);
    }
  };

  const standards = [
    {
      icon: <ShieldCheck size={20} className="text-red-900" />,
      title: "Accuracy & Verification",
      description:
        "Every campus news report, advisory, and event schedule is checked against official school memoranda and verified sources prior to publication.",
    },
    {
      icon: <BookOpen size={20} className="text-red-900" />,
      title: "Editorial Independence",
      description:
        "News coverage remains factual and objective, while editorials and opinion columns clearly distinguish commentary from straight news reporting.",
    },
    {
      icon: <Users size={20} className="text-red-900" />,
      title: "Student-Centered Voice",
      description:
        "We serve the students, faculty, and staff of AMA Computer College Lipa Campus by amplifying campus issues, achievements, and creative works.",
    },
    {
      icon: <CheckSquare size={20} className="text-red-900" />,
      title: "Accountability & Corrections",
      description:
        "Readers may submit feedback, clarifications, or correction requests directly through our Letters to the Editor desk for prompt editorial review.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 flex-1 w-full">
        <header className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-4">
            {PUBLICATION.institution}
          </p>
          <h1 className="text-4xl md:text-7xl font-serif font-black uppercase tracking-tighter mb-6 text-blue-900">
            Masthead &amp; Charter
          </h1>
          <div className="w-24 h-[3px] bg-amber-400 mx-auto"></div>
        </header>

        {loading ? (
          <div className="text-center font-serif italic text-gray-500 py-12">
            Retrieving publication records...
          </div>
        ) : (
          <div className="space-y-20">
            {/* MISSION */}
            <section className="text-center">
              <h2 className="text-2xl font-serif font-black uppercase mb-6 text-blue-900">
                Editorial Mission
              </h2>
              <blockquote className="text-lg md:text-xl font-serif text-gray-700 leading-relaxed italic max-w-2xl mx-auto border-l-4 border-amber-400 pl-6 text-left bg-white p-6 border border-gray-200">
                &ldquo;
                {missionOverride ||
                  "To empower the AMA Computer College Lipa Campus community through accurate, timely, and responsible journalism. We are committed to upholding editorial integrity and providing a credible digital platform where student voices resonate with clarity and purpose."}
                &rdquo;
              </blockquote>
            </section>

            {boardMembers.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-6 text-center flex items-center justify-center gap-2">
                  <Users size={15} /> Editorial Board
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  {boardMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 p-4 text-center"
                    >
                      <p className="font-serif font-bold text-blue-900 text-base">
                        {member.name}
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-red-900 mt-1">
                        {member.position}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* LIVE ARCHIVE METRICS */}
            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-6 text-center">
                Published Archive Index
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 border-y-[3px] border-blue-900">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-serif font-black mb-2 text-blue-900">
                    {counts.articles}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
                    Articles &amp; Features
                  </div>
                </div>
                <div className="text-center md:border-l border-gray-200">
                  <div className="text-4xl md:text-5xl font-serif font-black mb-2 text-blue-900">
                    {counts.announcements}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
                    Official Bulletins
                  </div>
                </div>
                <div className="text-center md:border-l border-gray-200">
                  <div className="text-4xl md:text-5xl font-serif font-black mb-2 text-blue-900">
                    {counts.events}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
                    Campus Events
                  </div>
                </div>
                <div className="text-center md:border-l border-gray-200">
                  <div className="text-4xl md:text-5xl font-serif font-black mb-2 text-blue-900">
                    {counts.albums}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
                    Photo Exhibits
                  </div>
                </div>
              </div>
            </section>

            {/* EDITORIAL STANDARDS */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-8 text-center">
                Journalistic &amp; Editorial Standards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {standards.map((item) => (
                  <div
                    key={item.title}
                    className="bg-white border-2 border-blue-900 p-6 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)]"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      {item.icon}
                      <h3 className="font-serif font-black text-lg text-blue-900">
                        {item.title}
                      </h3>
                    </div>
                    <p className="font-serif text-sm text-gray-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* HISTORICAL RECORD */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-8 text-center">
                Institutional Record
              </h2>
              <div className="space-y-10 max-w-2xl mx-auto">
                <div className="border-l-4 border-amber-400 pl-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    January 2025
                  </div>
                  <h3 className="text-xl font-serif font-black uppercase mb-2.5 text-blue-900">
                    Founding of The Binary Bulletin
                  </h3>
                  <p className="font-serif text-gray-700 leading-relaxed">
                    The Binary Bulletin was established as the official student publication of {PUBLICATION.institution}, forming a student-led newsroom dedicated to credible campus reporting and academic integrity.
                  </p>
                </div>
                <div className="border-l-4 border-amber-400 pl-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                    January 2026
                  </div>
                  <h3 className="text-xl font-serif font-black uppercase mb-2.5 text-blue-900">
                    Digital Publication Launch
                  </h3>
                  <p className="font-serif text-gray-700 leading-relaxed">
                    The publication transitioned to a unified digital newsroom and archive platform, enabling timely campus bulletins, multimedia reporting, and direct engagement with students across the campus community.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center pt-4">
              <Link
                to="/contact"
                className="inline-block bg-blue-900 text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-red-900 transition-colors"
              >
                Write to the Editorial Board
              </Link>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
