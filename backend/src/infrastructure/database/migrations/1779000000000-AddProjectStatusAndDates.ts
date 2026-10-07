import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectStatusAndDates1779000000000 implements MigrationInterface {
  name = 'AddProjectStatusAndDates1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD "status" character varying NOT NULL DEFAULT 'Not Started'`,
    );
    await queryRunner.query(`ALTER TABLE "projects" ADD "start_date" date`);
    await queryRunner.query(`ALTER TABLE "projects" ADD "end_date" date`);
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_status" ON "projects" ("organization_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_projects_status"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "end_date"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "start_date"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "status"`);
  }
}
