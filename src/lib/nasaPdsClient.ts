import { DataSourceStatus } from '../types';

export interface NasaPdsProduct {
  id: string;
  title: string;
  instrument?: string;
  mission?: string;
  type: string;
  observationTime?: string;
  labelUrl?: string;
  dataFileUrl?: string;
  archiveStatus?: string;
}

export class NasaPdsClient {
  private static readonly ENDPOINT = 'https://pds.nasa.gov/api/search/1/products';
  private static readonly DEFAULT_TIMEOUT_MS = 20000;

  /**
   * Performs a live query to the NASA Planetary Data System Search API
   */
  public static async queryLunarProducts(
    limit: number = 8,
    timeoutMs: number = NasaPdsClient.DEFAULT_TIMEOUT_MS
  ): Promise<{
    status: DataSourceStatus;
    products: NasaPdsProduct[];
  }> {
    const startTime = performance.now();
    const query = '(pds:Target_Identification.pds:name eq "Moon")';
    const url = `${this.ENDPOINT}?q=${encodeURIComponent(query)}&limit=${limit}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errMsg = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
        return {
          status: {
            id: 'nasa-pds',
            name: 'NASA Planetary Data System (PDS)',
            organization: 'NASA',
            url: 'https://pds.nasa.gov',
            status: 'HTTP_ERROR',
            httpStatus: response.status,
            error: errMsg,
            lastChecked: new Date().toISOString(),
            latencyMs,
            notice: `NASA PDS API returned ${errMsg}.`,
          },
          products: [],
        };
      }

      const json = await response.json();
      const rawProducts = json.data || [];

      const products: NasaPdsProduct[] = rawProducts.map((p: any) => {
        const props = p.properties || {};
        const meta = p.metadata || {};

        const instruments = props['ref_lid_instrument'] || props['pds:Observing_System_Component.pds:name'];
        const instrumentStr =
          Array.isArray(instruments) && instruments.length > 0
            ? String(instruments[0]).replace(/urn:nasa:pds:context:instrument:/, '')
            : typeof instruments === 'string' && instruments.length > 0
            ? instruments.replace(/urn:nasa:pds:context:instrument:/, '')
            : undefined;

        const rawMissionName = props['pds:Investigation_Area.pds:name'];
        const rawInvestigationRef =
          (Array.isArray(p.investigations) && p.investigations[0]?.id) ||
          (Array.isArray(props['ref_lid_investigation']) && props['ref_lid_investigation'][0]);
        const missionStr =
          Array.isArray(rawMissionName) && rawMissionName.length > 0
            ? String(rawMissionName[0])
            : typeof rawInvestigationRef === 'string' && rawInvestigationRef.length > 0
            ? rawInvestigationRef.replace(/^urn:nasa:pds:context:investigation:(mission\.)?/, '')
            : undefined;

        const dataFile = props['ops:Data_File_Info.ops:file_ref'] || [];
        const dataFileUrl = Array.isArray(dataFile) && dataFile.length > 0 ? dataFile[0] : undefined;

        const stopTime = props['pds:Time_Coordinates.pds:stop_date_time'] || props['pds:Time_Coordinates.pds:start_date_time'] || [];
        const timeStr = Array.isArray(stopTime) && stopTime.length > 0 ? stopTime[0] : meta.creation_date_time;

        return {
          id: p.id || '',
          title: p.title || props.title?.[0] || '',
          instrument: instrumentStr,
          mission: missionStr,
          type: p.type || 'Product_Observational',
          observationTime: timeStr,
          labelUrl: meta.label_url,
          dataFileUrl,
          archiveStatus: props['ops:Tracking_Meta.ops:archive_status']?.[0],
        };
      });

      const totalHits = json.summary?.hits ?? products.length;
      const status: DataSourceStatus = {
        id: 'nasa-pds',
        name: 'NASA Planetary Data System (PDS)',
        organization: 'NASA',
        url: 'https://pds.nasa.gov',
        status: 'ONLINE',
        httpStatus: response.status,
        lastChecked: new Date().toISOString(),
        latencyMs,
        productCount: totalHits,
        sampleProducts: products.map(p => ({
          id: p.id,
          title: p.title,
          instrument: p.instrument,
          mission: p.mission,
          time: p.observationTime,
          url: p.labelUrl || p.dataFileUrl,
        })),
        notice: `NASA reports ${totalHits.toLocaleString('en-US')} products whose target is the Moon (any mission); showing the first ${products.length}.`,
      };

      return { status, products };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const isTimeout = err?.name === 'AbortError' || String(err?.message).toLowerCase().includes('abort');
      const errMsg = err?.message || (isTimeout ? `Request timed out after ${timeoutMs}ms` : 'Network error');
      const notice = isTimeout
        ? `Request timed out after ${timeoutMs}ms (${errMsg}).`
        : `Connection error: ${errMsg}.`;

      return {
        status: {
          id: 'nasa-pds',
          name: 'NASA Planetary Data System (PDS)',
          organization: 'NASA',
          url: 'https://pds.nasa.gov',
          status: isTimeout ? 'TIMED_OUT' : 'OFFLINE',
          error: errMsg,
          lastChecked: new Date().toISOString(),
          latencyMs,
          notice,
        },
        products: [],
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
