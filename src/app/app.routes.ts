import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { TeamDetailComponent } from './components/team-detail/team-detail.component';
import { RepairReportComponent } from './components/repair-report/repair-report.component';
import { RepairReportsComponent } from './components/repair-reports/repair-reports.component';
import { TeamViewComponent } from './components/team-view/team-view.component';
import { DailySheetComponent } from './components/daily-sheet/daily-sheet.component';
import { ProfileManagementComponent } from './components/profile-management/profile-management.component';
import { DamageReportsComponent } from './components/damage-reports/damage-reports.component';
// import { ReservationsComponent } from './components/reservations/reservations.component';
import { Reservations2Component } from './components/reservations2/reservations2.component';
import { ReportUnscheduledTaskComponent } from './components/report-unscheduled-task/report-unscheduled-task.component';
import { DesignSystemComponent } from './components/design-system/design-system.component';
import { CanvasV2Component } from './components/canvas-v2/canvas-v2.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'daily-sheet', component: DailySheetComponent, canActivate: [AuthGuard] },
  { path: 'damage-reports', component: DamageReportsComponent, canActivate: [AuthGuard] },
  // { path: 'reservations', component: ReservationsComponent, canActivate: [AuthGuard] },
  { path: 'reservations2', component: Reservations2Component, canActivate: [AuthGuard] },
  { path: 'teams', component: TeamViewComponent, canActivate: [AuthGuard] },
  { path: 'team/:id', component: TeamDetailComponent },
  { path: 'repair-reports', component: RepairReportsComponent },
  { path: 'report-repair', component: RepairReportComponent },
  { path: 'report-unscheduled-task', component: ReportUnscheduledTaskComponent },
  { path: 'profiles', component: ProfileManagementComponent, canActivate: [AuthGuard] },
  { path: 'design-system', component: DesignSystemComponent },
  { path: 'infinite-canvas', component: CanvasV2Component },
  { path: '**', redirectTo: '/dashboard' }
];
