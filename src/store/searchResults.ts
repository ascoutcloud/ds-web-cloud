import { defineStore } from 'pinia';
import { GenericSearchResult } from '@/types/GenericSearchResult';
import { APIService } from '@/api/api-service';
import { useSpinnerStore } from '@/store/spinner';
import { ErrorManagerType } from '@/types/ErrorManagerType';
import { AxiosError } from 'axios';
import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export const useSearchResultStore = defineStore('searchResults', () => {
	const searchResult = ref([] as Array<GenericSearchResult>);
	const facetResult = ref([] as Array<string>);
	const errorManager = inject('errorManager') as ErrorManagerType;
	const searchFired = ref(false);
	const { t } = useI18n();
	const numFound = ref(0);
	const loading = ref(false);
	const error = ref('');
	const currentQuery = ref('');
	const noHits = ref(false);
	const filters = ref([] as Array<string>);
	const spinnerStore = useSpinnerStore();

	const addFilter = (filter: string) => {
		if (!filters.value.includes(filter)) {
			filters.value.push(filter);
		}
	};

	const resetSearch = () => {
		console.log('resetting everything o/');
		resetFilters();
		resetResults();
		currentQuery.value = '';
		searchFired.value = false;
	};

	const resetResults = () => {
		searchResult.value = searchResult.value.splice(0, searchResult.value.length);
	};

	const resetFilters = () => {
		filters.value = filters.value.splice(0, filters.value.length);
	};

	const removeFilter = (filter: string) => {
		filters.value.splice(filters.value.indexOf(filter), 1);
	};

	const getSearchResults = async (query: string) => {
		let fq = '';
		if (filters.value.length > 0) {
			filters.value.forEach((filt: string) => {
				fq += '&' + filt;
			});
		}
		try {
			spinnerStore.toggleSpinner(true);
			loading.value = true;
			const responseData = await APIService.getSearchResults(query, fq);
			currentQuery.value = query;
			searchResult.value = responseData.data.response.docs;
			facetResult.value = responseData.data.facet_counts.facet_fields;
			numFound.value = responseData.data.response.numFound;
			noHits.value = numFound.value === 0;
		} catch (err: unknown) {
			error.value = (err as AxiosError).message;
			errorManager.submitError(err as AxiosError, t('error.searchfailed'));
		} finally {
			spinnerStore.toggleSpinner(false);
			loading.value = false;
			searchFired.value = true;
		}
	};

	return {
		searchResult,
		facetResult,
		errorManager,
		numFound,
		loading,
		error,
		currentQuery,
		noHits,
		filters,
		searchFired,
		addFilter,
		resetFilters,
		removeFilter,
		getSearchResults,
		resetSearch,
	};
});
