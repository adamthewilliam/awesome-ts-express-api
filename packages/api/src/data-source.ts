import {DataSource, DataSourceOptions} from "typeorm"
import {Container} from "typedi";
import {UserRepository} from "./repositories/UserRepository";
import {User} from "./entity/User";

const baseConfig: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "app_db",
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV !== "production",
    entities: [User],
    migrations: [__dirname + "/migration/*.ts"],
}

export const AppDataSource = new DataSource(baseConfig);

Container.set("DATA_SOURCE", AppDataSource);
Container.set("USER_REPOSITORY", AppDataSource.getRepository(User));
