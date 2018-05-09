import { Injectable } from '@angular/core';
import {JsonConvert} from 'json2typescript';
import {DbGroup} from '../_models/DbModels/DbGroup';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';
import {catchError, switchMap} from 'rxjs/operators';
import {Group} from '../_models/Group';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {UserService} from './user.service';

@Injectable()
export class GroupService {

  private jsonConvert: JsonConvert = new JsonConvert();
  private groupsUrl = 'http://localhost:8080/lfg/groups';
  private currentGroup: Group;
  currentGroupSubject: BehaviorSubject<Group>;

  constructor(private http: HttpClient, private userService: UserService) {
    this.currentGroupSubject = new BehaviorSubject<Group>(null);
    this.userService.userSubject.subscribe( user => {
      this.currentGroup = user.groups.length ? user.groups[0] : null;
      this.currentGroupSubject = new BehaviorSubject(this.currentGroup);
    });
  }

  /*
  new group page and group page
  guard for both of them
  manage current group in group service
  */

  newGroup(group: DbGroup): Observable<boolean> {
    return this.http.post<any>(this.groupsUrl, this.jsonConvert.serialize(group), {
      observe: 'response'
    })
      .pipe(
        switchMap(response => {
          const createdGroupUrl = response.headers.get('location');
          return this.http.get<any>(createdGroupUrl, {
            observe: 'response'
          })
            .pipe(
              switchMap( getGroupResponse => {
                  const newGroup = this.jsonConvert.deserialize(getGroupResponse.body, Group);
                  this.currentGroupSubject.next(newGroup);
                  console.log(this.currentGroupSubject.getValue());
                  return Observable.of(true);
                }
              ),
              catchError((err: any) => this.newGroupErrorHandle(err))
            );
        }),
        catchError((err: any) => this.newGroupErrorHandle(err))
      );
  }

  private newGroupErrorHandle(err: any) {
    console.log('Error creating new post');
    console.log(err);
    return Observable.of(false);
  }


}
