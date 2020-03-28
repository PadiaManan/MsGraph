import * as React from "react";
import styles from "../ReactGroupSamples.module.scss";

import { PeoplePicker, PrincipalType } from '@pnp/spfx-controls-react/lib/PeoplePicker';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { CommandBarButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { ICheckMyMemberShipProps } from "./ICheckMyMemberShipProps";
import { ICheckMyMemberShipState } from "./ICheckMyMemberShipState";
import { MsGraphService } from "../../../../Service/MsGraphService";
import { Environment,EnvironmentType } from "@microsoft/sp-core-library";
import { IGroupItem } from "../../../../Common/IGroupItem";
import { GroupShowAll } from "office-ui-fabric-react/lib/GroupedList";

export class CheckMyMemberShip extends React.Component<ICheckMyMemberShipProps,ICheckMyMemberShipState>{
  private groupItems:IGroupItem[] = [];
  private headers = [
    { label: 'Name', key: 'name' },
    { label: 'Description', key: 'description' },
    { label: 'Group Type', key: 'groupTypes' }
  ];

  constructor(props:ICheckMyMemberShipProps){
    super(props);

    const columns: IColumn[] = [
      {
        key: 'column1',
        name: 'Name',
        isRowHeader: true,
        isSorted: true,
        isSortedDescending: false,
        sortAscendingAriaLabel: 'Sorted A to Z',
        sortDescendingAriaLabel: 'Sorted Z to A',
        fieldName: 'name',
        onColumnClick: this._onColumnClick,
        minWidth: 100,
        maxWidth: 400,
        isResizable: true
      },
      {
        key: 'column2',
        name: 'Description',
        fieldName: 'description',
        isSorted: true,
        isSortedDescending: false,
        onColumnClick: this._onColumnClick,
        minWidth: 300,
        maxWidth: 700,
        isResizable: true
      },
      {
        key: 'column3',
        name: 'Group Type',
        fieldName: 'groupTypes',
        onColumnClick: this._onColumnClick,
        minWidth: 100,
        maxWidth: 400,
        isResizable: true
      }
    ];

    this.state = {
      groupItems: this.groupItems,
      columns: columns,
      memberStatus: '',
      loading: false

    };
  }

  /**
   * Column click event handler to sort the results
   */
  private _onColumnClick = (ev:React.MouseEvent<HTMLElement>,column:IColumn):void=>{
    const {columns,groupItems} = this.state;
    const newColumns : IColumn[] = columns.slice();
    const currColumn: IColumn = newColumns.filter(currCol => column.key === currCol.key)[0];

    newColumns.forEach((newColumn:IColumn)=>{
      if(newColumn === currColumn){
        currColumn.isSortedDescending = !currColumn.isSortedDescending;
        currColumn.isSorted = true;
      }else{
        newColumn.isSorted = false;
        newColumn.isSortedDescending = true;
      }
    });
    const newItems = this._copyAndSort(groupItems, currColumn.fieldName!, currColumn.isSortedDescending);
    this.setState({
      columns: newColumns,
      groupItems: newItems
    });
  }

  /**
   * Sort results on column click
   * @param items
   * @param columnKey
   * @param isSortedDescending
   */
  private _copyAndSort<T>(items:T[],columnKey:string,isSortedDescending?: boolean):T[]{
    const key = columnKey as keyof T;
    return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
  }

  /***
   * Filter results by name
   */
  private _onFilter = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string): void => {
    this.setState({
      groupItems: text ? this.state.groupItems.filter(i => i.name.toLowerCase().indexOf(text.toLowerCase()) > -1) : this.groupItems
    });
  }

  /**
   *Get groups of which the I am member of
   */
  private _getMyGroups = ()=>{
    this.setState({loading:true},async()=>{
      let groupItems:IGroupItem[]=[];
      let memberStatus:string = '';
      try {
        //if(items.length > 0){
          let myGroups = await MsGraphService.GetMyUserGroups(this.props.context);
          if(myGroups.length === 0){
            memberStatus = 'The selected user does not belong to any group';
          }else{
            myGroups.map((myGroup)=>{
              groupItems.push({
                name: myGroup.displayName,
                description: myGroup.description,
                groupTypes: myGroup.groupTypes && myGroup.groupTypes.length > 0 ? 'Office 365 Group' : myGroup.securityEnabled === true ? 'Security Group' : 'Distribution Group'
              });
            });
          }
       // }
      } catch (error) {
        console.log("CheckMyMemberShip._getMyGroups Error:" + error);
      }
      console.log('CheckMyMemberShip._getMyGroups: ', groupItems);
      this.groupItems = groupItems;
      this.setState({ groupItems, memberStatus, loading: false });
    });
  }

  /**
   * Get my groups using Graph API once the toggle button is on
   */
  private _ToggleOnChanged = (ev:React.MouseEvent<HTMLElement>,checked:boolean) =>{
    console.log('toggle is ' + (checked ? 'checked' : 'not checked'));
    if(checked)
    {
      this._getMyGroups();
    }
    else
    {
      this.setState({
        groupItems:[]
      });
    }
  }

  /**
   * Render the html to DOM.
   */
  public render():React.ReactElement<ICheckMyMemberShipProps>{
    return(
      <div className={styles.reactGroupSamples}>
        <Toggle
          label="My Membership"
          defaultChecked = {false}
          onText="On"
          offText="Off"
          onChange={this._ToggleOnChanged}
          role="checkbox"
        ></Toggle>
        {/* <br/> */}
        {this.state.loading &&
        <Spinner label='Loading...' ariaLive='assertive'></Spinner>
        }
        {this.state.groupItems.length > 0 &&
           <div className={styles.detailsList}>
              <div className={styles.row}>
                <div className={styles.column}>
                    <TextField
                    label='Filter by Name:'
                    onChange={this._onFilter}
                    className={styles.filterTextfield}
                    />
                  </div>
                  <div className={styles.column}>
                    <p>Add CSV Link</p>
                  </div>
                </div>
                <br/>
                <DetailsList
                  items={this.state.groupItems}
                  columns = {this.state.columns}
                  isHeaderVisible={true}
                  setKey='set'
                  layoutMode = {DetailsListLayoutMode.justified}
                  selectionMode={SelectionMode.none}
                  ariaLabelForSelectionColumn='Toggle Selection'
                  ariaLabelForSelectAllCheckbox='Toggle selection for all items'
                  checkButtonAriaLabel='Row checkbox'
                  >
                </DetailsList>
             </div>
        }
        <p className={styles.memberStatus}>{this.state.memberStatus}</p>
      </div>
    );
  }

}



