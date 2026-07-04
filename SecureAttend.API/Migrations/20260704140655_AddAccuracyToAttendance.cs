using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecureAttend.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAccuracyToAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Accuracy",
                table: "Attendances",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Accuracy",
                table: "Attendances");
        }
    }
}
