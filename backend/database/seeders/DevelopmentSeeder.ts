import sequelize from "../../src/config/Database";
import { UserRoles } from "../../src/enum/UserRoles";
import User from "../../src/models/User";
import { buildUser, buildUsers, UserFactoryAttributes } from "../factories/UserFactory";

export async function runSeeders(user_admin_count: number = 5, user_park_guide_count: number = 10): Promise<void> {
    // Clear existing data
    await sequelize.drop();
    await sequelize.sync();

    // Default Admin user
    const adminUser = buildUser({
        username: "admin",
        password: "admin",
        role: UserRoles.ADMIN,
    });
    await User.create(adminUser);


    // Creating the users
    const adminUsers: UserFactoryAttributes[] = buildUsers(user_admin_count, { role: UserRoles.ADMIN });
    for (const user of adminUsers) {
        await User.create(user);
    }
    const parkGuideUsers: UserFactoryAttributes[] = buildUsers(user_park_guide_count, { role: UserRoles.PARK_GUIDE });
    for (const user of parkGuideUsers) {
        await User.create(user);
    }
}

export async function runDevelopmentSeeder(): Promise<void> {
	await runSeeders();
}

export default runSeeders;


const isDirectExecution =
	typeof process.argv[1] === "string" &&
	process.argv[1].includes("DevelopmentSeeder.ts");

if (isDirectExecution) {
	runDevelopmentSeeder().catch((error: unknown) => {
		console.error("Development seeder failed:", error);
		process.exit(1);
	});
}
