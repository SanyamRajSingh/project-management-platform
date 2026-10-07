import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { OrgScoped } from '../../../common/decorators/org-scoped.decorator';
import { RequestContext } from '../../../shared/interfaces';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @OrgScoped()
  @Get()
  async getDashboard(
    @CurrentUser() user: RequestContext,
  ): Promise<DashboardResponseDto> {
    return this.dashboardService.getStats(user.organizationId!);
  }
}
