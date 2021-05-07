import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { environment } from '../../environments/environment';


const apiUrl = environment.URL_API;

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  obtenerUsuarios(){
    return this.http.get(`${apiUrl}/usuarios`);
  }

  actualizaDisponibilidadRepartidor(repartidor){
    const id_repartidor = repartidor._id;
    if(repartidor.estado === 'danger'){
      repartidor.estado = 'success'
    }else{
      repartidor.estado = "danger";
    }
    console.log(repartidor);
    return this.http.put(`${apiUrl}/usuarios/${id_repartidor}`, repartidor);
  }

  obtenerHorarios(){
    return this.http.get(`${apiUrl}/horarios`);
  }

  actualizaHorario(horario){
    const id_horario = horario._id;
    return this.http.put(`${apiUrl}/horarios/${id_horario}`, horario);
  }

}
