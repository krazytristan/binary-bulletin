import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { PUBLICATION } from "../utils/editorial";
import { checkTableExists } from "../utils/cmsService";

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    checkTableExists("site_settings").then((exists) => {
      if (!exists || !active) return;
      supabase
        .from("site_settings")
        .select("publication_name, publication_description, contact_email, contact_address, facebook_url")
        .eq("id", "default")
        .maybeSingle()
        .then(({ data }) => {
          if (active && data) setSettings(data);
        });
    });
    return () => {
      active = false;
    };
  }, []);

  const pubName = settings?.publication_name || PUBLICATION.name;
  const pubEmail = settings?.contact_email || PUBLICATION.email;
  const pubAddress = settings?.contact_address || PUBLICATION.location;
  const pubFacebook = settings?.facebook_url || PUBLICATION.facebookUrl;
  const pubDesc =
    settings?.publication_description ||
    `The official student publication of ${PUBLICATION.institution}, committed to accurate, ethical, and student-centered campus journalism.`;

  return (
    <footer className="bg-blue-900 border-t-4 border-blue-950 text-white mt-16 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {/* BRAND */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/binary-logo.png"
              alt="The Binary Bulletin logo"
              className="h-9 w-9 object-contain bg-white rounded-full p-0.5"
            />
            <div>
              <h2 className="text-lg font-serif font-black uppercase tracking-tight text-white">
                {pubName}
              </h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">
                {PUBLICATION.shortInstitution}
              </p>
            </div>
          </div>
          <p className="text-sm font-serif text-blue-100 leading-relaxed mb-5">
            {pubDesc}
          </p>
          <a
            href={pubFacebook}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898v-2.891h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562v1.875h2.773l-.443 2.891h-2.33V21.88C18.343 21.13 22 16.991 22 12z" />
            </svg>
            Follow on Facebook
          </a>
        </div>

        {/* SECTIONS */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-widest mb-5 border-b border-blue-800 pb-2 text-blue-200">
            Publication Sections
          </h3>
          <ul className="space-y-2.5 text-sm font-serif text-blue-100">
            <li>
              <Link to="/news" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-4 transition-colors">
                News &amp; Campus Archive
              </Link>
            </li>
            <li>
              <Link to="/announcements" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-4 transition-colors">
                Official Announcements
              </Link>
            </li>
            <li>
              <Link to="/events" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-4 transition-colors">
                Campus Events Calendar
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-4 transition-colors">
                Photo Gallery
              </Link>
            </li>
            <li>
              <Link to="/thebinar" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-4 transition-colors">
                The Binary Online
              </Link>
            </li>
          </ul>
        </div>

        {/* PUBLISHER */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-widest mb-5 border-b border-blue-800 pb-2 text-blue-200">
            Editorial Desk
          </h3>
          <ul className="space-y-2.5 text-sm font-serif text-blue-100">
            <li>
              <Link to="/about" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-4 transition-colors">
                Masthead &amp; Charter
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-4 transition-colors">
                Letters to the Editor
              </Link>
            </li>
            <li className="pt-2 text-blue-200">{PUBLICATION.institution}</li>
            <li className="text-blue-200">{pubAddress}</li>
            <li>
              <a href={`mailto:${pubEmail}`} className="text-blue-100 hover:text-amber-400 transition-colors">
                {pubEmail}
              </a>
            </li>
          </ul>
        </div>

        {/* SDGs */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-widest mb-5 border-b border-blue-800 pb-2 text-blue-200">
            SDG Advocacy
          </h3>
          <div className="grid grid-cols-4 gap-2 mb-4 max-w-[200px]">
            <a href="https://sdgs.un.org/goals/goal4" target="_blank" rel="noopener noreferrer" title="SDG 4: Quality Education">
              <img src="/sdg4.png" alt="UN SDG 4: Quality Education" className="h-9 w-9 object-contain hover:opacity-80 transition bg-white p-1 rounded-sm" />
            </a>
            <a href="https://sdgs.un.org/goals/goal8" target="_blank" rel="noopener noreferrer" title="SDG 8: Decent Work and Economic Growth">
              <img src="/sdg8.webp" alt="UN SDG 8: Decent Work and Economic Growth" className="h-9 w-9 object-contain hover:opacity-80 transition bg-white p-1 rounded-sm" />
            </a>
            <a href="https://sdgs.un.org/goals/goal9" target="_blank" rel="noopener noreferrer" title="SDG 9: Industry, Innovation and Infrastructure">
              <img src="/sdg9.jpeg" alt="UN SDG 9: Industry, Innovation and Infrastructure" className="h-9 w-9 object-contain hover:opacity-80 transition bg-white p-1 rounded-sm" />
            </a>
            <a href="https://sdgs.un.org/goals/goal16" target="_blank" rel="noopener noreferrer" title="SDG 16: Peace, Justice and Strong Institutions">
              <img src="/sdg16.webp" alt="UN SDG 16: Peace, Justice and Strong Institutions" className="h-9 w-9 object-contain hover:opacity-80 transition bg-white p-1 rounded-sm" />
            </a>
          </div>
          <p className="text-xs font-serif text-blue-100 leading-relaxed italic">
            Advancing quality education, responsible innovation, and institutional transparency through student journalism.
          </p>
        </div>
      </div>

      <div className="border-t border-blue-950 py-5 px-6 text-center text-[11px] font-semibold uppercase tracking-widest text-blue-200">
        &copy; {new Date().getFullYear()} {PUBLICATION.name} &bull; {PUBLICATION.institution}. All rights reserved.
      </div>
    </footer>
  );
}
