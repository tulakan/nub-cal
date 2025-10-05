import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  client = inject(HttpClient);

  get<T>(url: string, params?: any) {
    /* add params */
    return this.client.get<T>(url, { params });
  }

  post<T>(url: string, body?: any) {
    return this.client.post<T>(url, body);
  }

  postEvent<T>(url: string, body?: any, options?: any) {
    return this.client.post<T>(url, body, options);
  }

  put<T>(url: string, body?: any) {
    return this.client.put<T>(url, body);
  }

  delete<T>(url: string) {
    return this.client.delete<T>(url);
  }

  patch<T>(url: string, body?: any) {
    return this.client.patch<T>(url, body);
  }
}
