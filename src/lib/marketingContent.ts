export const SEYMOUR_CONTACT = {
  phone: '+234 (0) 818 048 8200',
  phoneHref: 'tel:+2348180488200',
  email: 'info@seymouraviation.ng',
  emailHref: 'mailto:info@seymouraviation.ng',
  location: 'Murtala Muhammed International Airport (MMIA), Lagos, Nigeria',
} as const

export const SEYMOUR_VISION =
  'To be the indigenous pacesetter in aviation logistics and facility management.'

export const SEYMOUR_MISSION =
  'To be a customer service company that sells aviation services.'

export const SEYMOUR_ABOUT =
  'Seymour Aviation Limited is a 100% indigenous company, incorporated on December 4th, 2008. We specialize in aviation infrastructure, logistics, and facility management.'

export const CAR_PARK_INTRO =
  'The Seymour multi-level car park was conceived as part of our corporate aim of supporting the Federal Airport Authority of Nigeria\u2019s (FAAN\u2019s) objective of making Murtala Muhammed International Airport (MMIA) a hub for the West African aviation industry and a destination of choice for airport service providers and users.'

export const PARKING_FEATURES = [
  'Drive-in customer parking facility',
  'Reserve parking facility for individuals and corporates',
  'E-tag access system',
  'Car washing, re-wire and vulcanizing services',
  'Vehicle towing',
  'Overnight parking',
  'Parking management services',
] as const

export type CarParkAmenity = {
  id: string
  title: string
  description: string
  imageUrl: string
  /** Optional stat shown on featured cards (e.g. "4") */
  highlight?: string
}

export const CAR_PARK_AMENITIES: CarParkAmenity[] = [
  {
    id: 'elevators',
    title: '4 commercial elevators',
    description: 'Fast vertical movement between parking decks and terminal connections.',
    imageUrl:
      'https://images.unsplash.com/photo-1545558010-497880190577?auto=format&fit=crop&w=1400&q=80',
    highlight: '4',
  },
  {
    id: 'ablution',
    title: 'Convenience with ablution facilities',
    description: 'Clean, accessible washrooms and passenger convenience areas.',
    imageUrl:
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'waiting-room',
    title: 'Fully air-conditioned waiting room',
    description: 'A comfortable, climate-controlled lounge for passengers and visitors.',
    imageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'fire-systems',
    title: 'Automatic emergency fire systems',
    description: 'Integrated detection and suppression for safety across the facility.',
    imageUrl:
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3782?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'scanners',
    title: 'Vehicle scanner and bomb detectors',
    description: 'Entry-point screening to protect passengers, staff, and the airport.',
    imageUrl:
      'https://images.unsplash.com/photo-1563013546-824ae1b704d3?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'pa-systems',
    title: 'Public address systems',
    description: 'Clear announcements and guidance throughout the car park.',
    imageUrl:
      'https://images.unsplash.com/photo-1478737270239-2f02eb77ab3f?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'skywalks',
    title: 'Departure and arrival linking skywalks',
    description: 'Covered walkways linking the car park to MMIA terminals.',
    imageUrl:
      'https://images.unsplash.com/photo-1529078158508-98d22a76ae82?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'stairs',
    title: 'Stairs at strategic locations',
    description: 'Well-placed staircases for smooth foot traffic at peak times.',
    imageUrl:
      'https://images.unsplash.com/photo-1505843513577-22bbeca284ba?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'ticketing',
    title: 'Self-service ticketing and payment systems',
    description: 'Kiosks for quick ticket lookup and payment without queuing.',
    imageUrl:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80',
  },
]

export const FACILITY_HIGHLIGHTS = [
  { title: '3 Access points', description: 'Convenient car park entry across MMIA' },
  { title: 'Luggage area', description: 'Safe, monitored zones for passengers' },
  { title: '24/7 Monitoring', description: 'Security and surveillance across the facility' },
  { title: 'Multi-level design', description: 'Efficient parking for high airport traffic' },
] as const

export type GalleryItem = {
  id: string
  title: string
  caption: string
  imageUrl: string
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'mmia-terminal',
    title: 'MMIA Terminal access',
    caption: 'Passenger drop-off and terminal connections at MMIA.',
    imageUrl:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'multi-level-park',
    title: 'Multi-level car park',
    caption: 'Structured parking designed for airport traffic volume.',
    imageUrl:
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'arrivals-flow',
    title: 'Arrivals & departures',
    caption: 'Smooth vehicle flow for tourists and business travellers.',
    imageUrl:
      'https://images.unsplash.com/photo-1529078158508-98d22a76ae82?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'overnight-parking',
    title: 'Overnight parking',
    caption: 'Secure overnight options for extended stays.',
    imageUrl:
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'facility-monitoring',
    title: 'Facility monitoring',
    caption: 'CCTV and on-site management across the car park.',
    imageUrl:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'passenger-services',
    title: 'Passenger services',
    caption: 'Supporting FAAN\u2019s vision for a world-class airport hub.',
    imageUrl:
      'https://images.unsplash.com/photo-1464037866551-5662778c6e58?auto=format&fit=crop&w=1200&q=80',
  },
]
