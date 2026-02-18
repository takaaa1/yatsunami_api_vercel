import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('admin')
    @Roles('admin')
    @ApiOperation({ summary: 'Obter dados do dashboard administrativo' })
    @ApiResponse({ status: 200, description: 'Dados do dashboard retornados com sucesso' })
    getAdminDashboard(
        @Query('year') year?: string,
        @Query('month') month?: string,
    ) {
        return this.dashboardService.getAdminDashboard({
            year: year ? parseInt(year) : undefined,
            month: month ? parseInt(month) : undefined,
        });
    }

    @Get('user')
    @ApiOperation({ summary: 'Obter dados do dashboard do usuário' })
    @ApiResponse({ status: 200, description: 'Dados do dashboard retornados com sucesso' })
    getUserDashboard(@CurrentUser('id') userId: string) {
        return this.dashboardService.getUserDashboard(userId);
    }
}
