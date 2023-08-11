import { Component, OnInit } from '@angular/core';
import { Router  } from '@angular/router';
import { TableColumn, GrievancesTableData } from '../../../../interfaces/interfaces';
import { Tabs } from 'src/app/shared/config';
import { AuthService } from 'src/app/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { BreadcrumbItem, ConfigService } from 'src/app/shared';
import { GrievanceServiceService } from '../../services/grievance-service.service';
import { ToastrServiceService } from 'src/app/shared/services/toastr/toastr.service';
import { PageEvent } from '@angular/material/paginator';


@Component({
  selector: 'app-grievance-management',
  templateUrl: './grievance-management.component.html',
  styleUrls: ['./grievance-management.component.scss']
})
export class GrievanceManagementComponent  {
  grievances: GrievancesTableData[] = [];
  grievancesTableColumns: TableColumn[] = [];
  isDataLoading : boolean = false;
  userRole: string;
  tabs: any[] = [];
  selectedTab:any=null;
  length: number;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Grievance Management', url: '/home' },
    { label: 'Grievance List', url: 'grievance/manage-tickets' },
  ];
  grievancesTypes:any[] = [];
  getGrievancesRequest: any;
  constructor( 
    private router: Router,
    private authService: AuthService,
    private configService: ConfigService,
    private grievanceService: GrievanceServiceService,
    private toastrService:ToastrServiceService ){

    }

  pageIndex: number = 0;
  pageSize: number = 10;
  searchParams:string = '';
  sortHeader: string = 'created_date_ts';
  direction: string = 'desc';
  userId: string;

  ngOnInit(): void {
    this.grievancesTypes = this.configService.dropDownConfig.GRIEVANCE_TYPES;
    this.userRole = this.authService.getUserRoles()[0];
    this.userId= this.authService.getUserData().userId;
    this.initializeTabs();
    // this.getTicketsRequestObject();
  }

  initializeTabs(): void {
    const Roles = this.configService.rolesConfig.ROLES
    switch(this.userRole ){
      case Roles.NODAL_OFFICER:
        this.tabs = Tabs['Nodal Officer'];
        this.selectedTab =this.tabs[0].name;
        break;
      case Roles.SECRETARY:
        this.tabs = Tabs['Secretary'];
        this.selectedTab =this.tabs[0].name;
        break;
      case Roles.GRIEVANCE_NODAL:
        this.tabs = Tabs['Grievance Nodal'];
        this.selectedTab =this.tabs[0].name;
        break;
    }
    //Initialize column as per user Role
    this.initializeColumns();
    //Fetch grievances as per user  role
    this.getTicketsRequestObject();
  }

  initializeColumns(): void {
    this.grievancesTableColumns = [
      {
        columnDef: 'ticketId',
        header: 'ID',
        isSortable: true,
        cell: (element: Record<string, any>) => `${element['ticketId']}`
      },
      {
        columnDef: 'firstName',
        header: 'Grievance Raiser',
        isSortable: true,
        cell: (element: Record<string, any>) => `${element['firstName'] + ' ' + element['lastName']}`
      },
      {
        columnDef: 'requesterType',
        header: 'User Type',
        isSortable: true,
        cell: (element: Record<string, any>) => `${element['requesterType']}`
      },
      {
        columnDef: 'assignedToId',
        header: 'Raiser Type',
        isSortable: true,
        cell: (element: Record<string, any>) => `${element['assignedTo']}`
      },
      {
        columnDef: 'created_date_ts',
        header: 'Creation Time',
        isSortable: true,
        cell: (element: Record<string, any>) => `${element['createdDate']}`
      },
      {
        columnDef: 'escalated_date_ts',
        header: 'Escalation time',
        isSortable: true,
        cell: (element: Record<string, any>) => 
          `${element['escalatedDate']}` !== "null" ? `${element['escalatedDate']}` : '-'
      },
      {
        columnDef: 'isLink',
        header: '',
        isSortable: false,
        isLink: true,
        cell: (element: Record<string, any>) => `View Ticket`
      }

    ];
  }

  onTabChange(event: MatTabChangeEvent): void {
    // Here  we  have userrole and tab index with these 2 we know we need to fetch data for which tab of which user role so we pass relevant payload in get grievance service
    const selectedIndex = event.index;
    this.selectedTab = this.tabs[selectedIndex].name;
    // this.getgrievances();
    this.getTicketsRequestObject();
  }

  getSearchParams(searchterm:any){
    console.log('searchterm',searchterm)
    this.searchParams = searchterm;
    this.getTicketsRequestObject()
  }


  onClickItem(e: any) {
    // console.log(e?.ticketId)
    e.tabName= this.selectedTab
    let id = parseInt(e?.ticketId)
    this.router.navigate(['/grievance/'+ id],{ queryParams: {tabName:this.selectedTab}});
    // this.router.navigate(['/grievance',  2 ]);
   // this.router.navigate(['/grievance', e.id]);
  }

  getTicketsRequestObject() {
    this.getGrievancesRequest = {
      filter: {
       },
      "page": this.pageIndex,
      "size": this.pageSize,
      sort: {},
           // based on sort header -- column name and asc/dsc}
    }
    this.getGrievancesRequest.sort[this.sortHeader] = this.direction;
    if(this.searchParams !== "") {
      this.getGrievancesRequest = {
        ...this.getGrievancesRequest,
        searchKeyword: this.searchParams
      }
    }
     this.userRole
    switch(this.selectedTab) {
      case 'Pending': 
        this.getGrievancesRequest = {
          ...this.getGrievancesRequest,
          filter:{
            status:['OPEN'],
            cc: this.userRole === 'Nodal Officer' ?  this.userId: ''
          }
        }
        break;
      case 'Resolved': 
      this.getGrievancesRequest = {
        ...this.getGrievancesRequest,
        filter:{
          status:['CLOSED'],
          cc: this.userRole === 'Nodal Officer' ? this.userId: ''
        }
      }
      break;
      // this is failing
      case 'Priority': 
      this.getGrievancesRequest = {
        ...this.getGrievancesRequest,
        filter:{
          status:['OPEN'],
          cc: this.userRole === 'Nodal Officer' ? this.userId: ''
        },
        priority: "HIGH"
      }
      break;
      case 'Escalated to me': 
      this.getGrievancesRequest = {
        ...this.getGrievancesRequest,
        filter:{
          status:['CLOSED'],
          cc: ''
        },
        isEscalated: true,
        priority: "MEDIUM"
      }
      break;
      case 'Not Assigned':
        this.getGrievancesRequest = {
          ...this.getGrievancesRequest,
          filter:{
            status:['OPEN'],
            cc: ''
          },
        }
      break;
      case 'Junk': 
      this.getGrievancesRequest = {
        ...this.getGrievancesRequest,
        filter:{
          status:['CLOSED'],
          cc: ''
        },
        isJunk: true
      }
      break;
      default: 
      this.getGrievancesRequest
      break;
    }
    this.getAllTickets();
  }

  /** integration */
  getAllTickets() {
    this.isDataLoading = true;
    this.grievanceService.getAllTickets(this.getGrievancesRequest).subscribe({
      next: (res) => {
        this.isDataLoading = false;
        this.length = res.responseData.count;
        this.grievances = res.responseData.data;
        this.grievances.map((obj: any) => {
          this.grievancesTypes.map((grievanceType, index) => {
            if(obj.assignedToId === grievanceType.id) {
              obj.assignedTo = grievanceType.name;
            }
          })
        })
      },
      error: (err) => {
        // Handle the error here in case of Api failure
        this.toastrService.showToastr(err, 'Error', 'error', '');
      }
    })
    
  }

  handlePageChange(event: PageEvent) {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
      this.length = event.length;
      this.getTicketsRequestObject();
      // call API here
  }

  handleSortChange(e: any) {
    this.sortHeader = e.active;
    this.direction = e.direction;
    this.getTicketsRequestObject();
  }

}
