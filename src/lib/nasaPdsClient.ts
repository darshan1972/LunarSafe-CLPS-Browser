import { DataSourceStatus } from '../types';

export interface NasaPdsProduct {
  id: string;
  title: string;
  instrument: string;
  type: string;
  observationTime?: string;
  labelUrl?: string;
  dataFileUrl?: string;
  archiveStatus?: string;
}

export class NasaPdsClient {
  private static readonly ENDPOINT = 'https://pds.nasa.gov/api/search/1/products';

  /**
   * Performs a live query to the NASA Planetary Data System Search API
   */
  public static async queryLunarProducts(limit: number = 8): Promise<{
    status: DataSourceStatus;
    products: NasaPdsProduct[];
  }> {
    const startTime = performance.now();
    const query = '(pds:Target_Identification.pds:name eq "Moon")';
    const url = `${this.ENDPOINT}?q=${encodeURIComponent(query)}&limit=${limit}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(`NASA PDS API returned HTTP status ${response.status}`);
      }

      const json = await response.json();
      const rawProducts = json.data || [];

      const products: NasaPdsProduct[] = rawProducts.map((p: any) => {
        const props = p.properties || {};
        const meta = p.metadata || {};

        const instruments = props['ref_lid_instrument'] || props['pds:Observing_System_Component.pds:name'] || ['LRO/LOLA'];
        const instrumentStr = Array.isArray(instruments) ? instruments[0].replace(/urn:nasa:pds:context:instrument:/, '') : String(instruments);

        const dataFile = props['ops:Data_File_Info.ops:file_ref'] || [];
        const dataFileUrl = Array.isArray(dataFile) && dataFile.length > 0 ? dataFile[0] : undefined;

        const stopTime = props['pds:Time_Coordinates.pds:stop_date_time'] || props['pds:Time_Coordinates.pds:start_date_time'] || [];
        const timeStr = Array.isArray(stopTime) && stopTime.length > 0 ? stopTime[0] : meta.creation_date_time;

        return {
          id: p.id || 'N/A',
          title: p.title || props.title?.[0] || 'Lunar Product Observation',
          instrument: instrumentStr,
          type: p.type || 'Product_Observational',
          observationTime: timeStr,
          labelUrl: meta.label_url,
          dataFileUrl,
          archiveStatus: props['ops:Tracking_Meta.ops:archive_status']?.[0] || 'archived',
        };
      });

      const status: DataSourceStatus = {
        id: 'nasa-pds',
        name: 'NASA Planetary Data System (PDS)',
        organization: 'NASA',
        url: 'https://pds.nasa.gov',
        status: 'ONLINE',
        lastChecked: new Date().toISOString(),
        latencyMs,
        productCount: json.summary?.hits || products.length,
        sampleProducts: products.map(p => ({
          id: p.id,
          title: p.title,
          instrument: p.instrument,
          time: p.observationTime,
          url: p.labelUrl || p.dataFileUrl,
        })),
        notice: 'Live REST API connection verified. Open access enabled for lunar observation bundles (LRO, LOLA, Apollo).',
      };

      return { status, products };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        status: {
          id: 'nasa-pds',
          name: 'NASA Planetary Data System (PDS)',
          organization: 'NASA',
          url: 'https://pds.nasa.gov',
          status: 'OFFLINE',
          lastChecked: new Date().toISOString(),
          latencyMs,
          notice: `Connection error: ${err.message}. Check network connectivity to pds.nasa.gov.`,
        },
        products: [],
      };
    }
  }
}
