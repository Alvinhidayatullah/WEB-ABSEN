using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecureAttend.API.Migrations
{
    /// <inheritdoc />
    public partial class AddKeterangan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Keterangan",
                table: "Attendances",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Keterangan",
                table: "Attendances");
        }
    }
}
