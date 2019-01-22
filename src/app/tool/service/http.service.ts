import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd';
import { HandleError, HttpErrorHandlerService } from './http-error-handler.service';

// http 响应体类型
export interface HttpResponseType<T = any> {
  code: number;
  msg: string;
  data: T;
}

export enum StateCode {
  error =  400,
  ok = 200,
  timeout = 408,
  serviceError = 500
}

export enum PostContentType {
  default = 0,
  JSON = 1,
  FormData = 2
}

// 参数类型声明
interface ParamsType  {
  [propName: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private handleError: HandleError;

  constructor(
    private message: NzMessageService,
    private httpClient: HttpClient,
    httpErrorHandler: HttpErrorHandlerService
  ) {
    this.handleError = httpErrorHandler.createErrorHandler('数据获取服务类');
  }


  /**
   * Post 请求参数处理成 FormData 函数
   * @param _params|any
   */
  private toFormData(_params: any): FormData {
    if (!_params) {
      return new FormData();
    }
    if (_params.constructor === FormData) {
      return _params;
    }
    const formData = new FormData();
    for (const key in _params) {
      if (_params.hasOwnProperty(key)) {
        formData.append(key, _params[key]);
      }
    }
    return formData;
  }

  /**
   * GET 请求
   * @param _url|string 请求地址
   * @param _params|ParamsType 参数对象
   * @param feedback|string 请求的操作含义
   * @param safeResult|any 请求错误时的返回值
   */
  Get(_url: string, _params: ParamsType = {}, feedback: string = 'operation', safeResult: any): Observable<HttpResponseType> {
    const URL = environment.baseURL + _url;
    const params = new HttpParams({
      fromObject: _params
    });
    return this.httpClient.get<HttpResponseType>(URL, {
      params
    }).pipe(
      catchError(this.handleError('', feedback, safeResult))
    );
  }

  /**
   * 请求主体可以为 urlencoding、JSON、FormData 的 POST 请求
   * @param _url|string 请求地址
   * @param _params|ParamsType 参数对象
   * @param contentType|ContentType Post请求body编码格式
   * @param feedback|string 请求的操作含义
   * @param safeResult|any 请求错误时的返回值
   */
  Post(_url: string, _params: ParamsType, contentType: PostContentType, feedback: string = 'operation', safeResult: any): Observable<HttpResponseType> {
    let params;
    const URL = environment.baseURL + _url;
    switch (contentType) {
      case 0:
        params = new HttpParams({
          fromObject: _params
        });
        break;
      case 1:
        params = _params;
        break;
      case 2:
        params = this.toFormData(_params);
        break;
    }
    const messageID = this.message.loading('添加中...', { nzDuration: 0 }).messageId;
    return this.httpClient.post(URL, params, {
      
    }).pipe(
      map((response: HttpResponseType) => {
        return this.responseHandler(response, messageID);
        }),
      catchError(this.handleError(messageID, feedback, safeResult))
    );
  }

  /**
   * 请求主体为 JSON 的 PUT 请求
   * @param _url|string 请求地址
   * @param _params|ParamsType 参数对象
   * @param feedback|string 请求的操作含义
   * @param safeResult|any 请求错误时的返回值
   */
  Put(_url: string, _params: ParamsType, feedback: string = 'operation', safeResult: any): Observable<HttpResponseType> {
    const URL = environment.baseURL + _url;
    const messageID = this.message.loading('更新中...', { nzDuration: 0 }).messageId;
    return this.httpClient.put(URL, _params, {

    }).pipe(
      map((response: HttpResponseType) => {
        return this.responseHandler(response, messageID);
        }),
      catchError(this.handleError(messageID, feedback, safeResult))
    );
  }

  /**
   * DELETE 请求
   * @param _url|string API接口地址
   * @param _params|ParamsType 参数对象
   * @param feedback|string 请求的操作含义
   * @param safeResult|any 请求错误时的返回值
   */
  Delete(_url: string, _params: ParamsType, feedback: string = 'operation', safeResult: any): Observable<HttpResponseType> {
    const URL = environment.baseURL + _url;
    const params = new HttpParams({
      fromObject: _params
    });
    const messageID = this.message.loading('删除中...', { nzDuration: 0 }).messageId;
    return this.httpClient.put(URL, {
      params
    }).pipe(
      map((response: HttpResponseType) => {
        return this.responseHandler(response, messageID);
        }),
      catchError(this.handleError(messageID, feedback, safeResult))
    );
  }

  /**
   * 请求成功情况处理
   * @param response|HttpResponseType
   * @param messageID|string
   */
  private responseHandler(response: HttpResponseType, messageID: string): HttpResponseType {
    this.message.remove(messageID);
    if (response.code === StateCode.ok) {
      // 请求成功
      this.message.success(response.msg);
    } else {
      // 请求异常以外的非成功状态码，如状态码 3XX
      this.message.warning(response.msg);
    }
    return response;
  }
}
