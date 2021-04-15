/**
 * External dependencies
 */
import '@automattic/calypso-config';

/**
 * Internal dependencies
 */
import '../../constants';
import { getDesignUrl, getDesignImageUrl, getAvailableDesigns } from '../available-designs';
import { availableDesignsConfig } from '../available-designs-config';

import type { Design } from '../../types';

jest.mock( '@automattic/calypso-config', () => ( {
	// Useful because the getAvailableDesigns function uses feature flags for
	// arguments default values
	isEnabled: () => false,
} ) );

jest.mock( '../available-designs-config', () => {
	const mockDesign: Design = {
		title: 'Mock',
		slug: 'mock-design-slug',
		template: 'mock-design-template',
		theme: 'mock-design-theme',
		fonts: {
			headings: 'Arvo',
			base: 'Cabin',
		},
		categories: [ 'featured' ],
		is_premium: false,
		features: [],
	};

	const mockDesignPremium: Design = {
		title: 'Mock',
		slug: 'mock-premium-design-slug',
		template: 'mock-premium-design-template',
		theme: 'mock-premium-design-theme',
		fonts: {
			headings: 'Arvo',
			base: 'Cabin',
		},
		categories: [ 'featured' ],
		is_premium: true,
		features: [],
	};

	const mockDesignFse: Design = {
		title: 'Mock',
		slug: 'mock-premium-design-slug',
		template: 'mock-premium-design-template',
		theme: 'mock-premium-design-theme',
		fonts: {
			headings: 'Arvo',
			base: 'Cabin',
		},
		categories: [ 'featured' ],
		is_premium: false,
		is_fse: true,
		features: [],
	};

	const mockDesignAlpha: Design = {
		title: 'Mock',
		slug: 'mock-premium-design-slug',
		template: 'mock-premium-design-template',
		theme: 'mock-premium-design-theme',
		fonts: {
			headings: 'Arvo',
			base: 'Cabin',
		},
		categories: [ 'featured' ],
		is_premium: false,
		is_alpha: true,
		features: [],
	};

	return {
		availableDesignsConfig: {
			featured: [ mockDesign, mockDesignPremium, mockDesignFse, mockDesignAlpha ],
		},
	};
} );

const mockLocale = 'mock-locale';

describe( 'Design Picker design utils', () => {
	describe( 'getDesignUrl', () => {
		it( 'should compose the correct design API URL', () => {
			const mockDesign = availableDesignsConfig.featured[ 0 ];

			expect( getDesignUrl( mockDesign, mockLocale ) ).toEqual(
				`https://public-api.wordpress.com/rest/v1/template/demo/${ mockDesign.theme }/${ mockDesign.template }?font_headings=${ mockDesign.fonts.headings }&font_base=${ mockDesign.fonts.base }&site_title=${ mockDesign.title }&viewport_height=700&language=${ mockLocale }&use_screenshot_overrides=true`
			);
		} );
	} );

	describe( 'getDesignImageUrl', () => {
		it( 'should compose the correct design API URL', () => {
			const mockDesign = availableDesignsConfig.featured[ 0 ];

			expect( getDesignImageUrl( mockDesign ) ).toMatchInlineSnapshot(
				`"/calypso/images/design-screenshots/mock-design-slug_mock-design-template_mock-design-theme.webp?v=3"`
			);
		} );
	} );

	describe( 'getAvailableDesigns', () => {
		it( 'should get FSE and alpha designs', () => {
			const mockDesignFSE = availableDesignsConfig.featured[ 2 ];
			expect( getAvailableDesigns( { includeAlphaDesigns: true, useFseDesigns: true } ) ).toEqual( {
				featured: [ mockDesignFSE ],
			} );
		} );

		it( 'should get alpha designs and exclude FSE designs', () => {
			const mockDesign = availableDesignsConfig.featured[ 0 ];
			const mockDesignPremium = availableDesignsConfig.featured[ 1 ];
			const mockDesignAlpha = availableDesignsConfig.featured[ 3 ];
			expect( getAvailableDesigns( { includeAlphaDesigns: true, useFseDesigns: false } ) ).toEqual(
				{
					featured: [ mockDesign, mockDesignPremium, mockDesignAlpha ],
				}
			);
		} );

		it( 'should get only FSE, non-alpha designs', () => {
			const mockDesignFSE = availableDesignsConfig.featured[ 2 ];
			expect( getAvailableDesigns( { includeAlphaDesigns: false, useFseDesigns: true } ) ).toEqual(
				{
					featured: [ mockDesignFSE ],
				}
			);
		} );

		it( 'should get all non-alpha, non-FSE designs', () => {
			const mockDesign = availableDesignsConfig.featured[ 0 ];
			const mockDesignPremium = availableDesignsConfig.featured[ 1 ];
			expect( getAvailableDesigns( { includeAlphaDesigns: false, useFseDesigns: false } ) ).toEqual(
				{
					featured: [ mockDesign, mockDesignPremium ],
				}
			);
		} );

		it( 'should randomize the results order when the randomize flag is specified', () => {
			// Randomization is checked by comparing randomized and non-randomized
			// return values, and checking that these values are normally different,
			// but that they are equal after being sorted.
			// Testing randomness is hard! Since the results of a random shuffle can be the same
			// as the non-shuffled version, this check is repeated `maxRepetitions` times
			// before marking a failed test.

			const sortDesignsBySlug = ( a: Design, b: Design ) => a.slug.localeCompare( b.slug );

			const maxRepetitions = 10;

			const designs = getAvailableDesigns( { randomize: false } ).featured;
			let designsRandom: Design[] = [];

			let isOrderDifferent = false;
			let i = 0;
			while ( i < maxRepetitions && ! isOrderDifferent ) {
				designsRandom = getAvailableDesigns( { randomize: true } ).featured;

				const differentContent = JSON.stringify( designs ) !== JSON.stringify( designsRandom );
				const sameContentWhenSorted =
					JSON.stringify( [ ...designs ].sort( sortDesignsBySlug ) ) ===
					JSON.stringify( [ ...designsRandom ].sort( sortDesignsBySlug ) );

				isOrderDifferent = differentContent && sameContentWhenSorted;
				i += 1;
			}

			expect( isOrderDifferent ).toBeTruthy();
		} );
	} );
} );