/* The Bhawans (hostels) of IIT Roorkee, for the pickers in the student app and the supervisor setup.
   Written from memory of the campus: check it against the institute's own list before real use. */
export const BHAWANS = [
  'Azad Bhawan', 'Cautley Bhawan', 'Ganga Bhawan', 'Govind Bhawan', 'Himalaya Bhawan', 'Indira Bhawan', 'Jawahar Bhawan',
  'Kasturba Bhawan', 'Malviya Bhawan', 'Radhakrishnan Bhawan', 'Rajendra Bhawan', 'Rajiv Bhawan', 'Ravindra Bhawan', 'Sarojini Bhawan',
]
/** Block letters for a Bhawan with `n` blocks: A, B, C ... */
export const blockNames = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i))
