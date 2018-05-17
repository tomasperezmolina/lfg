import { Injectable } from '@angular/core';
import {JsonConvert} from 'json2typescript';
import {DbGroup} from '../_models/DbModels/DbGroup';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';
import {catchError, map, switchMap} from 'rxjs/operators';
import {Group} from '../_models/Group';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {UserService} from './user.service';
import {User} from '../_models/User';

@Injectable()
export class GroupService {

  private jsonConvert: JsonConvert = new JsonConvert();
  private groupsUrl = 'http://localhost:8080/lfg/groups';
  private currentGroup: Group;
  private user: User;
  currentGroupSubject: BehaviorSubject<Group>;

  constructor(private http: HttpClient, private userService: UserService) {
    this.currentGroupSubject = new BehaviorSubject<Group>(null);
    this.currentGroup = null;
    this.userService.userSubject.subscribe( user => {
      this.user = user;
      if (user !== null && user.groups.length) {
        this.updateGroup(user.groups[0].id).subscribe();
      } else {
        this.currentGroupSubject.next(null);
        this.currentGroup = null;
      }
    });
  }

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
    console.log('Error creating new group');
    console.log(err);
    return Observable.of(false);
  }

  updateGroup(id: number): Observable<boolean> {
    return this.http.get<any>(this.groupsUrl + '/' + id, {
      observe: 'response'
    })
      .pipe(
        map( getGroupResponse => {
            const newGroup = this.jsonConvert.deserialize(getGroupResponse.body, Group);
            this.currentGroup = newGroup;
            this.currentGroupSubject.next(newGroup);
            return true;
          }
        ),
        catchError((err: any) => this.updateGroupErrorHandle(err))
      );
  }

  private updateGroupErrorHandle(err: any) {
    console.log('Error retrieving group'); // TODO remove user from group?
    console.log(err);
    return Observable.of(false);
  }

  joinGroup(idGroup: number): Observable<boolean> {
    if (this.currentGroup !== null) {
      return this.leaveGroup().pipe(
        switchMap(result => {
          if (result) {
            return this.joinGroup(idGroup);
          } else {
            return this.joinGroupErrorHandle();
          }
        }),
        catchError((err: any) => this.leaveGroupErrorHandle(err))
      );
    } else {
      return this.joinGroup(idGroup);
    }
  }

  joinGroupRequest(idGroup: number): Observable<boolean> {
    return this.http.post<any>(this.groupsUrl + '/' + idGroup + '/members' , {id: this.user.id}, {
      observe: 'response'
    })
      .pipe(
        switchMap(response => {
          return this.updateGroup(idGroup);
        }),
        catchError((err: any) => this.joinGroupErrorHandle(err))
      );
  }

  private joinGroupErrorHandle(err?: any) {
    console.log('Error joining group');
    console.log(err);
    return Observable.of(false);
  }

  leaveGroup(idMember?: number): Observable<boolean> {
    const idUser = idMember || this.user.id;
    return this.http.delete<any>(this.groupsUrl + '/' + this.currentGroup.id + '/members/' + idUser, {
      observe: 'response'
    })
      .pipe(
        map(response => {
          this.currentGroup = null;
          this.currentGroupSubject.next(null);
          return true;
        }),
        catchError((err: any) => this.leaveGroupErrorHandle(err))
      );
  }

  private leaveGroupErrorHandle(err: any) {
    console.log('Error leaving group');
    console.log(err);
    return Observable.of(false);
  }
}
