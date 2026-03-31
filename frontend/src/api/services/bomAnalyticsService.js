import api from '../client';

class BomAnalyticsService {
    async seedHistoricalData() {
        const response = await api.post('/bom-analytics/seed');
        return response.data;
    }

    async getPartTrends(partNumber, itemType = null) {
        const params = {};
        if (itemType) params.item_type = itemType;
        const response = await api.get(`/bom-analytics/trends/${partNumber}`, { params });
        return response.data;
    }

    async getVendorDiscounts(months = 12) {
        const response = await api.get('/bom-analytics/vendor-discounts', {
            params: { months }
        });
        return response.data;
    }

    /**
     * Autocomplete: returns distinct part numbers matching `query`.
     * @param {string} query
     * @param {string|null} itemType  – 'main' | 'component' | null (all)
     */
    async searchParts(query, itemType = null) {
        const params = { q: query };
        if (itemType) params.item_type = itemType;
        const response = await api.get('/bom-analytics/search-parts', { params });
        return response.data;
    }

    /**
     * Cross-order aggregation.
     * Price per point = (Σ main lines + Σ secondary lines) / main_qty
     * Only orders that contain BOTH mainPart AND at least one secondaryPart are returned.
     *
     * @param {string}   mainPart        – part number of the "head" (regex search)
     * @param {string[]} secondaryParts  – exact part numbers of accessories
     * @returns {{ trends: [{recorded_at, total_price}] }}
     */
    async getAggregatedTrends(mainPart, secondaryParts) {
        const response = await api.post('/bom-analytics/aggregate-trends', {
            main_part: mainPart,
            secondary_parts: secondaryParts,
        });
        return response.data; // { trends: [{recorded_at, total_price}] }
    }

    /**
     * Vendor spending over time.
     * @param {string} resolution  - 'daily' | 'monthly' | 'yearly'
     * @param {string|null} startDate - YYYY-MM-DD
     * @param {string|null} endDate   - YYYY-MM-DD
     * @returns {{ data: [{bucket, vendor, total}] }}
     */
    async getVendorSpending(resolution = 'monthly', startDate = null, endDate = null) {
        const params = { resolution };
        if (startDate) params.start_date = startDate;
        if (endDate)   params.end_date   = endDate;
        const response = await api.get('/bom-analytics/vendor-spending', { params });
        return response.data;
    }
}

export default new BomAnalyticsService();
