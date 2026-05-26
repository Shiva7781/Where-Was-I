import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Sphere, Graticule, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

// world-atlas uses ISO 3166-1 numeric IDs; geoip-lite returns alpha-2
const NUM_TO_ALPHA2 = {
  4:'AF',8:'AL',12:'DZ',20:'AD',24:'AO',32:'AR',36:'AU',40:'AT',
  31:'AZ',44:'BS',48:'BH',50:'BD',112:'BY',56:'BE',84:'BZ',204:'BJ',
  64:'BT',68:'BO',70:'BA',72:'BW',76:'BR',96:'BN',100:'BG',854:'BF',
  108:'BI',116:'KH',120:'CM',124:'CA',140:'CF',148:'TD',152:'CL',
  156:'CN',170:'CO',178:'CG',180:'CD',188:'CR',191:'HR',192:'CU',
  196:'CY',203:'CZ',208:'DK',262:'DJ',214:'DO',218:'EC',818:'EG',
  222:'SV',232:'ER',233:'EE',231:'ET',242:'FJ',246:'FI',250:'FR',
  266:'GA',270:'GM',268:'GE',276:'DE',288:'GH',300:'GR',320:'GT',
  324:'GN',624:'GW',328:'GY',332:'HT',340:'HN',348:'HU',356:'IN',
  360:'ID',364:'IR',368:'IQ',372:'IE',376:'IL',380:'IT',388:'JM',
  392:'JP',400:'JO',398:'KZ',404:'KE',408:'KP',410:'KR',414:'KW',
  417:'KG',418:'LA',428:'LV',422:'LB',426:'LS',430:'LR',434:'LY',
  440:'LT',442:'LU',807:'MK',450:'MG',454:'MW',458:'MY',466:'ML',
  478:'MR',484:'MX',498:'MD',496:'MN',499:'ME',504:'MA',508:'MZ',
  104:'MM',516:'NA',524:'NP',528:'NL',554:'NZ',558:'NI',562:'NE',
  566:'NG',578:'NO',512:'OM',586:'PK',591:'PA',598:'PG',600:'PY',
  604:'PE',608:'PH',616:'PL',620:'PT',634:'QA',642:'RO',643:'RU',
  646:'RW',682:'SA',686:'SN',688:'RS',694:'SL',706:'SO',710:'ZA',
  728:'SS',724:'ES',144:'LK',729:'SD',740:'SR',752:'SE',756:'CH',
  760:'SY',158:'TW',762:'TJ',834:'TZ',764:'TH',626:'TL',768:'TG',
  780:'TT',788:'TN',792:'TR',795:'TM',800:'UG',804:'UA',784:'AE',
  826:'GB',840:'US',858:'UY',860:'UZ',862:'VE',704:'VN',887:'YE',
  894:'ZM',716:'ZW',352:'IS',703:'SK',705:'SI',480:'MU',
};

export default function HeatMap({ heatmapData }) {
  const [tooltip, setTooltip] = useState(null);

  const countByCode = useMemo(() => {
    const m = {};
    for (const d of heatmapData) m[d.code] = d.count;
    return m;
  }, [heatmapData]);

  const maxCount = useMemo(() => Math.max(1, ...heatmapData.map((d) => d.count)), [heatmapData]);

  const colorScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxCount * 0.1, maxCount * 0.5, maxCount])
        .range(['#0f172a', '#1e3a5f', '#1d4ed8', '#ef4444'])
        .clamp(true),
    [maxCount]
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 140, center: [0, 20] }}
        style={{ width: '100%', height: '100%', background: '#060d1a' }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={8}>
          <Sphere fill="#060d1a" stroke="#1e293b" strokeWidth={0.5} />
          <Graticule stroke="#1e293b" strokeWidth={0.3} />
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const alpha2 = NUM_TO_ALPHA2[parseInt(geo.id, 10)];
                const count  = alpha2 ? (countByCode[alpha2] || 0) : 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={colorScale(count)}
                    stroke="#1e293b"
                    strokeWidth={0.3}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', filter: 'brightness(1.4)' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={(e) =>
                      setTooltip({ name: geo.properties?.name || alpha2 || '?', count, x: e.clientX, y: e.clientY })
                    }
                    onMouseMove={(e) =>
                      setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : t)
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div style={{ position: 'fixed', top: tooltip.y + 12, left: tooltip.x + 12, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '6px 12px', pointerEvents: 'none', zIndex: 9999, fontSize: 13, color: '#e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,.6)' }}>
          <strong>{tooltip.name}</strong>
          <br />
          <span style={{ color: '#94a3b8', fontSize: 12 }}>
            {tooltip.count > 0 ? `${tooltip.count} visit${tooltip.count !== 1 ? 's' : ''}` : 'No visits'}
          </span>
        </div>
      )}

      <Legend scale={colorScale} max={maxCount} />
    </div>
  );
}

function Legend({ scale, max }) {
  const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ value: Math.round(max * t), color: scale(max * t) }));
  return (
    <div style={{ position: 'absolute', bottom: 24, right: 24, background: 'rgba(15,23,42,.9)', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#94a3b8' }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>Visits</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {stops.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ width: 18, height: 12, background: s.color, borderRadius: 2 }} />
            <span style={{ marginRight: 4 }}>{s.value}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
