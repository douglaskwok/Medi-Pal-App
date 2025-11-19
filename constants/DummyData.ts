export const dummyResources = [
  {
    id: '1',
    name: 'Community Health Center',
    type: 'Clinic',
    distance: '0.5 mi',
    address: '123 Main St, San Francisco, CA 94102',
    rating: 4.5,
    image: null,
  },
  {
    id: '2',
    name: 'Medi-Cal Pharmacy',
    type: 'Pharmacy',
    distance: '1.2 mi',
    address: '456 Market St, San Francisco, CA 94103',
    rating: 4.8,
    image: null,
  },
  {
    id: '3',
    name: 'Free Dental Clinic',
    type: 'Dental',
    distance: '2.1 mi',
    address: '789 Mission St, San Francisco, CA 94105',
    rating: 4.3,
    image: null,
  },
  {
    id: '4',
    name: 'Mental Health Services',
    type: 'Mental Health',
    distance: '1.8 mi',
    address: '321 Castro St, San Francisco, CA 94114',
    rating: 4.7,
    image: null,
  },
];

export const dummyChecklistItems = [
  {
    id: '1',
    title: 'Annual physical exam',
    date: new Date(),
    completed: false,
  },
  {
    id: '2',
    title: 'Flu shot',
    date: new Date(),
    completed: false,
  },
  {
    id: '3',
    title: 'Dental cleaning',
    date: new Date(Date.now() + 86400000),
    completed: false,
  },
  {
    id: '4',
    title: 'Eye exam',
    date: new Date(Date.now() + 172800000),
    completed: false,
  },
];

