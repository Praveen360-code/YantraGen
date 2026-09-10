import { useState } from 'react'
import type { InstrumentDto } from '../api/types'

interface HistoryEntry {
  title: string
  builder: string
  built: string
  items: { problem: string; solution: string }[]
  onlineResources?: { label: string; url: string }[]
}

const HISTORIES: Record<string, HistoryEntry> = {
  samrat: {
    title: 'Samrat Yantra',
    builder: 'Maharaja Sawai Jai Singh II of Jaipur',
    built: 'between 1724 and 1735 CE',
    items: [
      {
        problem:
          'The edge of the giant shadow was fuzzy, making it hard to see the exact time.',
        solution:
          'Astronomers used a simple physics tool — a thin lead rod or a taut piece of string held parallel to the shadow’s edge just above the marble scale. By sliding this thin object in and out of the fuzzy zone, they could read the time precisely.',
      },
      {
        problem:
          'Aligning a massive, heavy brick wall perfectly with the North Star was nearly impossible to do on the first try.',
        solution:
          'He used a step-by-step approach called prototyping. Instead of building the giant structure immediately, he built the Laghu Samrat Yantra (a small "practice" stone model). He tested his alignment math on the smaller model first, fixed the errors, and used those proven measurements to construct the giant, perfectly aligned Vrihat Samrat Yantra.',
      },
    ],
    onlineResources: [
      {
        label: 'Jantar Mantar, Jaipur — Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Jantar_Mantar,_Jaipur',
      },
      {
        label: 'Samrat Yantra — JantarMantar.org',
        url: 'https://www.jantarmantar.org/learn/observatories/instruments/samrat/index.html',
      },
    ],
  },
  dakshinottara_bhitti: {
    title: 'Dakshinottara Bhitti Yantra — North-South Wall Instrument',
    builder: 'Maharaja Sawai Jai Singh II',
    built:
      'Delhi Observatory: 1724 (later adapted/rebuilt into the Mishra Yantra around 1750–1754); Jaipur Observatory: 1728–1734',
    items: [
      {
        problem:
          'The wall had to stand perfectly straight up (90 degrees) and point exactly North-South. If the builders made the wall lean even a tiny bit, the sun’s shadow would hit the wrong spot, and the clock would fail.',
        solution:
          'He used a plumb line — a heavy weight hanging from a string. By holding this string against the wall while the builders laid the bricks, he could instantly see if the wall was leaning and fix it on the spot.',
      },
      {
        problem:
          'The wall worked great during the day because the sun cast a bright shadow on it. But stars do not cast shadows, making the wall useless at night.',
        solution:
          'He attached a small metal tube or ring to the wall. At night, an astronomer would climb a ladder, look through a moving pointer on the wall’s scale, and line it up with the star through that tube — like aiming a giant stone telescope.',
      },
    ],
    onlineResources: [
      {
        label: 'Dakshinottara Bhitti Yantra — JantarMantar.org',
        url: 'https://www.jantarmantar.org/learn/observatories/instruments/daksinottaraBhitti/index.html',
      },
    ],
  },
  rama: {
    title: 'Rama Yantra',
    builder: 'Maharaja Sawai Jai Singh II',
    built: 'Delhi Observatory: 1724; Jaipur Observatory: 1728–1734',
    items: [
      {
        problem:
          'The astronomer needed to walk inside the giant circular building to read the stars, but a solid stone floor left no space to walk without stepping on and blocking the measuring marks.',
        solution:
          'He built two identical twin buildings with alternating floor gaps; if a reading fell into an empty space in the first building, the astronomer easily found the solid stone scale in the second one.',
      },
    ],
    onlineResources: [
      {
        label: 'Sriramachakra — Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Sriramachakra',
      },
    ],
  },
  digamsa: {
    title: 'Digamsa Yantra',
    builder: 'Maharaja Sawai Jai Singh II',
    built: 'Delhi Observatory: 1724; Jaipur Observatory: 1728–1734',
    items: [
      {
        problem:
          'The astronomer needed to walk inside the giant circular building to read the stars, but a solid stone floor left no space to walk without stepping on and blocking the measuring marks.',
        solution:
          'He built two identical twin buildings with alternating floor gaps; if a reading fell into an empty space in the first building, the astronomer easily found the solid stone scale in the second one.',
      },
    ],
    onlineResources: [
      {
        label: 'Digamsa Yantra — JantarMantar.org',
        url: 'https://www.jantarmantar.org/learn/observatories/instruments/digamsa/index.html',
      },
    ],
  },
  dhruva_protha_chakra: {
    title: 'Dhruva-Protha-Chakra Yantra',
    builder: 'Maharaja Sawai Jai Singh II',
    built:
      'most commonly referred to today as the Chakra Yantra (or associated with the Dhruva Darshak Pattika platform); built between 1728 and 1734',
    items: [
      {
        problem:
          'Traditional instruments made it hard to track the vertical position (declination) and hour angles of moving planets and stars relative to the fixed North Star (Dhruva) as the Earth rotated.',
        solution:
          'He built a pair of large brass or alloy rings mounted on vertical stone pillars. These rings were designed to rotate freely around an axis perfectly parallel to the Earth’s axis. By turning the rings and aligning them with a target planet, astronomers could immediately read its coordinates on a global scale.',
      },
    ],
    onlineResources: [
      {
        label: 'The Dhruvabhrama Yantra of Padmanabha — Scribd',
        url: 'https://www.scribd.com/document/757783959/The-Dhruvabhrama-Yantra-of-Padmanabha',
      },
    ],
  },
  yantra_samrat: {
    title: 'Yantra-Samrat (Jaipur)',
    builder:
      'also known as the Vrihat Samrat Yantra or the “Supreme Instrument”; Maharaja Sawai Jai Singh II',
    built: 'between 1728 and 1734',
    items: [
      {
        problem:
          'Smaller sundials were inaccurate because the sun’s shadow moved too quickly and looked too blurry to measure exact seconds.',
        solution:
          'He built a giant 90-foot-tall stone triangle with massive curved marble scales, stretching the shadow out so widely that observers could easily read the time down to an accurate two seconds.',
      },
    ],
    onlineResources: [
      {
        label: "World's Largest Sundial — Testbook",
        url: 'https://testbook.com/static-gk/worlds-largest-sundial',
      },
    ],
  },
  gola_chakra: {
    title: 'Golayantra Chakra Yantra (Jaipur)',
    builder: 'Maharaja Sawai Jai Singh II',
    built: 'between 1728 and 1734',
    items: [
      {
        problem:
          'Translating flat maps of the sky into 3D models of the round Earth and moving planets caused confusing mathematical errors.',
        solution:
          'He built a giant, hollow metal sphere (Gola) with moving brass rings (Chakra) that perfectly mimicked the round sky, allowing astronomers to see and track celestial paths in 3D.',
      },
    ],
    onlineResources: [
      {
        label: 'Astronomical Instruments (Yantras) in Indian Astronomy — CollegeHive',
        url: 'https://notes.collegehive.in/books/indian-knowledge-system/page/astronomical-instruments-yantras-in-indian-astronomy',
      },
    ],
  },
  bhitti: {
    title: 'Bhitti Yantra (Jaipur)',
    builder: 'Maharaja Sawai Jai Singh II',
    built: 'between 1728 and 1734',
    items: [
      {
        problem:
          'Handheld altitude tools would shake or warp, making it impossible to get a steady, precise measurement of the sun’s highest point at noon.',
        solution:
          'He built a massive, unshakeable stone wall facing exactly North-South with marble scales plastered on it, providing a rock-solid surface to track the sun’s exact midday angle.',
      },
    ],
    onlineResources: [
      {
        label: 'Bhitti Yantra — NASA ADS',
        url: 'https://ui.adsabs.harvard.edu/abs/2026asi..confP.203S/abstract',
      },
    ],
  },
  rasivalaya: {
    title: 'Rasivalaya Yantras (Jaipur)',
    builder: 'Maharaja Sawai Jai Singh II',
    built: 'between 1728 and 1734',
    items: [
      {
        problem:
          'Normal sundials only tracked the sun’s position, requiring complex, lengthy math to convert that data into the coordinates of the 12 zodiac signs.',
        solution:
          'He built a group of 12 distinct stone sundials — one for each zodiac sign — each tilted at a unique mathematical angle so an astronomer could read a star’s zodiac position directly without doing any math.',
      },
    ],
    onlineResources: [
      {
        label: 'Rasivalaya — JantarMantar.org',
        url: 'https://jantarmantar.org/learn/observatories/instruments/Rasivalaya/index.html',
      },
      {
        label: 'Zodiac Gallery — JantarMantar.org',
        url: 'https://www.jantarmantar.org/gallery/ZodiacGallery/index.php',
      },
    ],
  },
  nadi_valaya: {
    title: 'Nadi Valaya Yantra (Jaipur)',
    builder: 'Maharaja Sawai Jai Singh II',
    built: 'between 1728 and 1734',
    items: [
      {
        problem:
          'Normal flat sundials became highly inaccurate during the equinoxes because the sun’s angle relative to the Earth’s equator changes drastically throughout the year.',
        solution:
          'He built a double-sided circular wall tilted parallel to the Earth’s equator; the northern side tracks the sun for six months of spring/summer, and the southern side takes over for the six months of autumn/winter.',
      },
    ],
    onlineResources: [
      {
        label: 'Nadi Valay Yantra — Rudra Vedh',
        url: 'https://rudravedh.in/Nadi_Valay_Yantra.html',
      },
    ],
  },
  palaka: {
    title: 'Palaka Yantra (Jaipur)',
    builder: 'Maharaja Sawai Jai Singh II',
    built: 'between 1728 and 1734',
    items: [
      {
        problem:
          'Traditional stone instruments were completely fixed in one spot, making it impossible to quickly calculate a star’s changing position at any random hour of the night.',
        solution:
          'He built a large, swinging metal plate mounted on a stone frame with a central sighting needle, allowing astronomers to manually tilt and aim the board directly at any celestial body to instantly read its altitude.',
      },
    ],
    onlineResources: [
      {
        label: 'Phalakayantra — Wisdomlib',
        url: 'https://www.wisdomlib.org/definition/phalakayantra',
      },
      {
        label: 'Maharaja to Prince — Scribd',
        url: 'https://www.scribd.com/document/269566218/2014-Maharaja-to-Prince',
      },
    ],
  },
  chaapa: {
    title: 'Chaapa Yantra (Jaipur)',
    builder: 'Maharaja Sawai Jai Singh II',
    built: 'between 1728 and 1734',
    items: [
      {
        problem:
          'Smaller handheld tools used to measure the sun’s distance from the highest point in the sky (zenith distance) would twist or shake, leading to incorrect angle readings.',
        solution:
          'He built a large, heavy metal semi-circular ring (Chaapa means arc/bow) fixed securely to a stone frame, allowing astronomers to steadily measure the sun’s exact height and altitude at any moment.',
      },
    ],
    onlineResources: [
      {
        label: 'JKLK — Scribd',
        url: 'https://www.scribd.com/document/429439153/jklk',
      },
      {
        label: 'Ancient Indian Astronomical Instruments — Sanskriti Magazine',
        url: 'https://www.sanskritimagazine.com/ancient-indian-astronomical-instruments-of-bhaskaracharya/',
      },
    ],
  },
}

export default function HistorySection({
  instruments,
  activeType,
}: {
  instruments: InstrumentDto[]
  activeType: string | null
}) {
  const [open, setOpen] = useState<string | null>(activeType)

  return (
    <section className="history" id="history">
      <div className="history-head">
        <h2 className="panel-title">History of a Yantra</h2>
        <p className="history-sub">
          Select any yantra to read about its builder, when it was built, and
          the problems it solved.
        </p>
      </div>

      <div className="history-strip">
        {instruments.map((inst) => {
          const enabled = Boolean(HISTORIES[inst.type])
          const isOpen = open === inst.type
          return (
            <button
              key={inst.type}
              className={`history-tab${isOpen ? ' active' : ''}`}
              onClick={() =>
                enabled && setOpen(isOpen ? null : inst.type)
              }
              disabled={!enabled}
            >
              <span className="history-name">{inst.name}</span>
              {enabled && <span className="history-toggle">+</span>}
            </button>
          )
        })}
      </div>

      {open && HISTORIES[open] && (
        <div className="history-card">
          <div className="history-headline">
            <h3 className="history-title">{HISTORIES[open].title}</h3>
            <div className="history-meta">
              <span className="history-builder">{HISTORIES[open].builder}</span>
              <span className="history-built">{HISTORIES[open].built}</span>
            </div>
          </div>
          <div className="history-timeline">
            {HISTORIES[open].items.map((it, i) => (
              <div className="history-tl-item" key={i}>
                <span className="history-tl-node" aria-hidden="true" />
                <div className="history-card-body">
                  <div className="history-tl-step">
                    <span className="history-tag">Problem {i + 1}</span>
                    <p>{it.problem}</p>
                  </div>
                  <div className="history-tl-step">
                    <span className="history-tag history-tag-sol">Solution</span>
                    <p>{it.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {HISTORIES[open].onlineResources &&
            HISTORIES[open].onlineResources.length > 0 && (
              <div className="history-resources">
                <h4 className="history-resources-title">Archive &amp; resources</h4>
                <ul className="history-resources-list">
                  {HISTORIES[open].onlineResources.map((r, i) => (
                    <li key={i}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {!instruments.length && <p className="history-empty">Loading instruments…</p>}
    </section>
  )
}
